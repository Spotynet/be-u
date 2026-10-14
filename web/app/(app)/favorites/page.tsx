"use client";

import {PageContainer} from "@/components/layout/PageContainer";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useFavorites} from "@/features/favorites/hooks/useFavorites";
import {postApi, errorUtils} from "@/lib/api";
import {PostCard} from "@/components/posts/PostCard";

const INK = "#12211A";
const MAIN = "#558367";
const DARK = "#1F3328";

export default function FavoritesPage() {
  const {favorites, loading, error, removeFavorite} = useFavorites();
  const [tab, setTab] = useState<"providers" | "posts">("providers");
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const router = useRouter();

  const loadLiked = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const res = await postApi.getLikedPosts();
      setLikedPosts(res.data.results || []);
    } catch (err) {
      setPostsError(errorUtils.getErrorMessage(err));
      setLikedPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "posts") loadLiked();
  }, [tab, loadLiked]);

  const providerHref = (f: {public_profile_id?: number | null; content_object_id?: number}) => {
    const publicId = f.public_profile_id;
    if (publicId) return `/profile/${publicId}`;
    // Fallback only if API omitted public_profile_id
    return `/explore`;
  };

  return (
    <PageContainer size="md">
      <h1 className="nabbi-page-title">Favoritos</h1>
      <p className="nabbi-page-sub">
        Proveedores guardados y publicaciones que te gustaron.
      </p>

      <div style={{display: "flex", gap: 8, marginBottom: 18}}>
        <Chip active={tab === "providers"} onClick={() => setTab("providers")} label="Proveedores" />
        <Chip active={tab === "posts"} onClick={() => setTab("posts")} label="Posts" />
      </div>

      {tab === "providers" && (
        <>
          {loading && <p style={{color: "#64748b"}}>Cargando…</p>}
          {error && (
            <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
              {error}
            </div>
          )}
          {!loading && favorites.length === 0 && (
            <p style={{color: "#64748b"}}>
              Aún no tienes favoritos.{" "}
              <Link href="/explore" style={{color: MAIN, fontWeight: 700}}>
                Explorar
              </Link>
            </p>
          )}
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {favorites.map((f) => (
              <div
                key={f.id}
                className="nabbi-stack-row"
                style={{
                  background: "white",
                  borderRadius: 14,
                  border: "1px solid rgba(18,33,26,0.08)",
                  padding: 14,
                  justifyContent: "space-between",
                }}>
                <Link
                  href={providerHref(f)}
                  style={{textDecoration: "none", color: INK, flex: "1 1 160px", minWidth: 0}}>
                  <div style={{fontWeight: 800, wordBreak: "break-word"}}>
                    {f.favorite_name || `Favorito #${f.content_object_id}`}
                  </div>
                  <div style={{fontSize: 12, color: MAIN, fontWeight: 700, marginTop: 2}}>
                    {f.favorite_type === "PLACE" ? "Lugar" : "Profesional"}
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={removingId === f.id}
                  onClick={async () => {
                    setRemovingId(f.id);
                    try {
                      await removeFavorite(f.id);
                    } finally {
                      setRemovingId(null);
                    }
                  }}
                  style={{
                    border: "1.5px solid #e11d48",
                    background: "transparent",
                    color: "#e11d48",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 13,
                    flexShrink: 0,
                    opacity: removingId === f.id ? 0.6 : 1,
                  }}>
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "posts" && (
        <>
          {postsLoading && <p style={{color: "#64748b"}}>Cargando…</p>}
          {postsError && (
            <div style={{background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 12, color: "#dc2626"}}>
              {postsError}
            </div>
          )}
          {!postsLoading && likedPosts.length === 0 && (
            <p style={{color: "#64748b"}}>Aún no has dado like a ninguna publicación.</p>
          )}
          <div style={{display: "flex", flexDirection: "column", gap: 14}}>
            {likedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{...post, user_has_liked: true}}
                onLike={async (id) => {
                  await postApi.likePost(id);
                  await loadLiked();
                }}
              />
            ))}
          </div>
          {likedPosts.length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/feed")}
              style={{
                marginTop: 16,
                border: "none",
                background: "transparent",
                color: MAIN,
                fontWeight: 700,
                cursor: "pointer",
              }}>
              Ir al feed →
            </button>
          )}
        </>
      )}
    </PageContainer>
  );
}

function Chip({label, active, onClick}: {label: string; active: boolean; onClick: () => void}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1.5px solid ${MAIN}` : "1.5px solid rgba(85,131,103,0.2)",
        background: active ? "rgba(85,131,103,0.12)" : "white",
        color: DARK,
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}>
      {label}
    </button>
  );
}
