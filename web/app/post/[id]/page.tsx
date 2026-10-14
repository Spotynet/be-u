"use client";

import {Suspense, useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {AppShell} from "@/components/layout/AppShell";
import {ContentActions} from "@/components/moderation/ContentActions";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {postApi, errorUtils} from "@/lib/api";

const INK = "#12211A";
const DARK = "#1F3328";
const MAIN = "#558367";
const ACCENT = "#F6C531";

function mediaUrls(post: any): string[] {
  const media = post?.media || post?.images || post?.media_files || [];
  if (Array.isArray(media) && media.length) {
    return media
      .map((m: any) => (typeof m === "string" ? m : m.url || m.image || m.file))
      .filter(Boolean);
  }
  if (post?.image) return [post.image];
  if (post?.before || post?.after) return [post.before, post.after].filter(Boolean);
  return [];
}

function PostDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Number(params?.id);
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError("Publicación no válida");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [postRes, commentsRes] = await Promise.all([
        postApi.getPost(id),
        postApi.getComments(id).catch(() => ({data: {results: []}})),
      ]);
      const p = postRes.data;
      if (searchParams.get("liked") === "true") {
        p.user_has_liked = true;
      }
      setPost(p);
      setComments(commentsRes.data.results || []);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  const requireAuth = (next: string) => {
    router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      requireAuth(`/post/${id}`);
      return;
    }
    try {
      const res = await postApi.likePost(post.id);
      const liked = res.data?.liked ?? !post.user_has_liked;
      setPost((p: any) => {
        const wasLiked = !!p.user_has_liked;
        const nextLiked = typeof liked === "boolean" ? liked : !wasLiked;
        const delta = nextLiked === wasLiked ? 0 : nextLiked ? 1 : -1;
        return {
          ...p,
          user_has_liked: nextLiked,
          likes_count: Math.max(0, (p.likes_count || 0) + delta),
        };
      });
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !comment.trim()) return;
    if (!isAuthenticated) {
      requireAuth(`/post/${id}`);
      return;
    }
    setSubmitting(true);
    try {
      await postApi.createComment(post.id, comment.trim());
      setComment("");
      const commentsRes = await postApi.getComments(post.id);
      setComments(commentsRes.data.results || []);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm("¿Eliminar esta publicación?")) return;
    try {
      await postApi.deletePost(post.id);
      router.push("/feed");
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    }
  };

  const urls = mediaUrls(post);
  const profileId =
    post?.author_profile_id || post?.author_public_profile_id || post?.public_profile_id;
  const isOwner =
    user &&
    (Number(post?.author) === Number(user.id) ||
      Number(post?.author_id) === Number(user.id) ||
      Number(post?.user) === Number(user.id));

  const groupSessionId =
    post?.linked_group_session_id || post?.linked_group_session || post?.group_session_id;

  const bookingHref = (() => {
    if (!post) return null;
    if (post.linked_service_id || post.linked_service) {
      const svcId = post.linked_service_id || post.linked_service;
      const qs = new URLSearchParams({
        serviceInstanceId: String(svcId),
        serviceTypeId: String(post.linked_service_type_id || svcId),
        serviceName: post.linked_service_name || "Servicio",
        serviceType:
          post.linked_service_type === "place_service" ? "place_service" : "professional_service",
        providerId: String(post.linked_provider_id || profileId || 0),
        providerName: post.author_name || "Proveedor",
        price: String(post.linked_service_price || ""),
        duration: String(post.linked_service_duration_minutes || 60),
      });
      return `/booking?${qs.toString()}`;
    }
    if (profileId) return `/profile/${profileId}`;
    return null;
  })();

  const authorUserId =
    Number(post?.author || post?.author_id || post?.user || post?.user_id) || null;

  return (
    <div className="nabbi-page" style={{maxWidth: 560, margin: "0 auto", width: "100%"}}>
      <Link href="/feed" style={{color: MAIN, fontWeight: 700, textDecoration: "none", fontSize: 14}}>
        ← Feed
      </Link>

      {loading && <p style={{color: "#64748b", marginTop: 16}}>Cargando…</p>}
      {error && (
        <div style={{marginTop: 16, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
          {error}
        </div>
      )}

      {post && !loading && (
        <article
          style={{
            marginTop: 16,
            background: "white",
            borderRadius: 18,
            border: "1px solid rgba(18,33,26,0.08)",
            overflow: "hidden",
          }}>
          <div
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}>
            <div style={{fontWeight: 900, fontSize: 18, color: INK}}>
              {profileId ? (
                <Link href={`/profile/${profileId}`} style={{color: INK, textDecoration: "none"}}>
                  {post.author_name || "Usuario"}
                </Link>
              ) : (
                post.author_name || "Usuario"
              )}
            </div>
            {!isOwner && (
              <ContentActions
                targetType="post"
                targetId={post.id}
                authorUserId={authorUserId}
                loginNext={`/post/${id}`}
                onBlocked={() => router.push("/feed")}
              />
            )}
          </div>

          {urls.length > 0 && (
            <div style={{position: "relative", background: "#0f1a15", aspectRatio: "4/5"}}>
              <img
                src={urls[Math.min(slide, urls.length - 1)]}
                alt=""
                style={{width: "100%", height: "100%", objectFit: "cover"}}
              />
              {urls.length > 1 && (
                <div style={{position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6}}>
                  {urls.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlide(i)}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        border: "none",
                        background: i === slide ? "white" : "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{padding: 16}}>
            {(post.content || post.caption) && (
              <p style={{margin: "0 0 12px", color: DARK, lineHeight: 1.55, fontSize: 15}}>
                {post.content || post.caption}
              </p>
            )}

            <div style={{display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16}}>
              <button
                type="button"
                onClick={handleLike}
                style={{
                  border: "1.5px solid rgba(85,131,103,0.25)",
                  background: "white",
                  borderRadius: 12,
                  padding: "8px 14px",
                  fontWeight: 800,
                  color: post.user_has_liked ? "#e11d48" : DARK,
                  cursor: "pointer",
                }}>
                {post.user_has_liked ? "♥" : "♡"} {post.likes_count ?? 0}
              </button>
              {bookingHref && (
                <Link
                  href={bookingHref}
                  style={{
                    background: ACCENT,
                    color: INK,
                    textDecoration: "none",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontWeight: 800,
                    fontSize: 14,
                  }}>
                  {post.linked_service_id || post.linked_service ? "Reservar" : "Ver perfil"}
                </Link>
              )}
              {groupSessionId && (
                <Link
                  href={`/group-sessions/${groupSessionId}`}
                  style={{
                    background: MAIN,
                    color: "white",
                    textDecoration: "none",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontWeight: 800,
                    fontSize: 14,
                  }}>
                  Ver sesión grupal
                </Link>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    border: "1.5px solid #dc2626",
                    background: "transparent",
                    color: "#dc2626",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                  Eliminar
                </button>
              )}
            </div>

            <h2 style={{margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: INK}}>Comentarios</h2>
            <div style={{display: "flex", flexDirection: "column", gap: 10, marginBottom: 14}}>
              {comments.length === 0 && (
                <p style={{color: "#64748b", fontSize: 14, margin: 0}}>Sé el primero en comentar.</p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#f8faf9",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 14,
                    color: DARK,
                  }}>
                  <strong>{c.author_name || c.user_name || "Usuario"}</strong>
                  <div style={{marginTop: 4}}>{c.content || c.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} style={{display: "flex", gap: 8}}>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario…"
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(85,131,103,0.22)",
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                style={{
                  background: MAIN,
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 16px",
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: submitting || !comment.trim() ? 0.6 : 1,
                }}>
                Enviar
              </button>
            </form>
          </div>
        </article>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={<p style={{color: "#64748b"}}>Cargando…</p>}>
        <PostDetailInner />
      </Suspense>
    </AppShell>
  );
}
