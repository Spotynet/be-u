"use client";

import {Suspense, useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {PageHeaderRow, StackLayout} from "@/components/layout";
import {ContentActions} from "@/components/moderation/ContentActions";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {postApi, errorUtils} from "@/lib/api";
import {loginHref} from "@/lib/authGate";
import {
  postAuthorName,
  postAuthorProfileId,
  postAuthorUserId,
  postMediaUrls,
} from "@/lib/posts";

function PostDetailInner() {
  usePageHeader({title: "Publicación", pageOwnsTitle: true});
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
    router.push(loginHref(next));
  };

  const openGatedPath = (path: string | null) => {
    if (!path) return;
    if (!isAuthenticated) {
      requireAuth(path);
      return;
    }
    router.push(path);
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

  const urls = postMediaUrls(post);
  const profileId = postAuthorProfileId(post);
  const authorName = postAuthorName(post);
  const authorUserId = postAuthorUserId(post);
  const isOwner = !!(user && authorUserId && Number(user.id) === authorUserId);

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
        providerName: authorName || "Proveedor",
        price: String(post.linked_service_price || ""),
        duration: String(post.linked_service_duration_minutes || 60),
      });
      return `/booking?${qs.toString()}`;
    }
    if (profileId) return `/profile/${profileId}`;
    return null;
  })();

  return (
    <StackLayout>
      <PageHeaderRow
        title="Publicación"
        meta={
          <Link
            href="/feed"
            className="text-sm font-bold text-primary no-underline">
            ← Feed
          </Link>
        }
      />

      {loading && <p className="text-foreground-muted">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-error/40 bg-error/10 p-3 text-error">
          {error}
        </div>
      )}

      {post && !loading && (
        <article className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-card lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="text-lg font-black text-foreground">
                {profileId ? (
                  <button
                    type="button"
                    onClick={() => openGatedPath(`/profile/${profileId}`)}
                    className="border-0 bg-transparent p-0 text-left text-lg font-black text-foreground">
                    {authorName}
                  </button>
                ) : (
                  authorName
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
              <div className="relative aspect-[4/5] max-h-[70vh] bg-primary-dark lg:aspect-auto lg:min-h-[420px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urls[Math.min(slide, urls.length - 1)]}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {urls.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {urls.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlide(i)}
                        className={[
                          "h-2 w-2 rounded-full border-0",
                          i === slide ? "bg-white" : "bg-white/40",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col border-t border-card-border p-4 lg:border-l lg:border-t-0">
            {(post.content || post.caption) && (
              <p className="mb-3 text-[15px] leading-relaxed text-foreground">
                {post.content || post.caption}
              </p>
            )}

            <div className="mb-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleLike}
                className={[
                  "rounded-xl border-[1.5px] border-primary/25 bg-card px-3.5 py-2 font-extrabold",
                  post.user_has_liked ? "text-rose-600" : "text-foreground",
                ].join(" ")}>
                {post.user_has_liked ? "♥" : "♡"} {post.likes_count ?? 0}
              </button>
              {bookingHref && (
                <button
                  type="button"
                  onClick={() => openGatedPath(bookingHref)}
                  className="rounded-xl bg-secondary px-3.5 py-2 text-sm font-extrabold text-secondary-foreground">
                  {post.linked_service_id || post.linked_service
                    ? "Reservar"
                    : "Ver perfil"}
                </button>
              )}
              {groupSessionId && (
                <button
                  type="button"
                  onClick={() => openGatedPath(`/group-sessions/${groupSessionId}`)}
                  className="rounded-xl bg-primary px-3.5 py-2 text-sm font-extrabold text-white">
                  Ver sesión grupal
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl border-[1.5px] border-error bg-transparent px-3.5 py-2 font-bold text-error">
                  Eliminar
                </button>
              )}
            </div>

            <h2 className="mb-2.5 text-base font-extrabold text-foreground">
              Comentarios
            </h2>
            <div className="mb-3 flex max-h-[320px] flex-col gap-2.5 overflow-y-auto lg:flex-1">
              {comments.length === 0 && (
                <p className="m-0 text-sm text-foreground-muted">
                  Sé el primero en comentar.
                </p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-background px-3 py-2.5 text-sm text-foreground">
                  <strong>{c.author_name || c.user_name || "Usuario"}</strong>
                  <div className="mt-1">{c.content || c.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="mt-auto flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario…"
                className="min-w-0 flex-1 rounded-xl border-[1.5px] border-primary/25 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="rounded-xl bg-primary px-4 font-extrabold text-white disabled:opacity-60">
                Enviar
              </button>
            </form>
          </div>
        </article>
      )}
    </StackLayout>
  );
}

export default function PostDetailPage() {
  return (
    <Suspense fallback={<p className="text-foreground-muted">Cargando…</p>}>
      <PostDetailInner />
    </Suspense>
  );
}
