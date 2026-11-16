"use client";

import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ProviderCard, SectionHeader} from "@/components/marketplace";
import {useFavorites} from "@/features/favorites/hooks/useFavorites";
import {postApi, errorUtils} from "@/lib/api";
import {PostCard} from "@/components/posts/PostCard";

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

  const providerHref = (f: {
    public_profile_id?: number | null;
    content_object_id?: number;
  }) => {
    const publicId = f.public_profile_id;
    if (publicId) return `/profile/${publicId}`;
    return `/explore`;
  };

  return (
    <div className="nabbi-page mx-auto w-full max-w-[1100px]">
      <SectionHeader
        title="Favoritos"
        subtitle="Proveedores guardados y publicaciones que te gustaron."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <TabChip
          active={tab === "providers"}
          onClick={() => setTab("providers")}
          label="Proveedores"
        />
        <TabChip
          active={tab === "posts"}
          onClick={() => setTab("posts")}
          label="Posts"
        />
      </div>

      {tab === "providers" && (
        <>
          {loading && <p className="text-foreground-muted">Cargando…</p>}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-600">
              {error}
            </div>
          )}
          {!loading && favorites.length === 0 && (
            <p className="text-foreground-muted">
              Aún no tienes favoritos.{" "}
              <Link href="/explore" className="font-bold text-primary">
                Explorar
              </Link>
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((f) => (
              <div key={f.id} className="relative">
                <ProviderCard
                  provider={{
                    id: f.public_profile_id || f.content_object_id || f.id,
                    name: f.favorite_name || `Favorito #${f.content_object_id}`,
                    profile_type: f.favorite_type,
                  }}
                  href={providerHref(f)}
                />
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
                  className="absolute right-2 top-2 z-10 rounded-lg border border-rose-500 bg-card/95 px-2.5 py-1.5 text-[12px] font-bold text-rose-600 disabled:opacity-60">
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "posts" && (
        <>
          {postsLoading && <p className="text-foreground-muted">Cargando…</p>}
          {postsError && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-600">
              {postsError}
            </div>
          )}
          {!postsLoading && likedPosts.length === 0 && (
            <p className="text-foreground-muted">
              Aún no has dado like a ninguna publicación.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
              className="mt-4 border-0 bg-transparent font-bold text-primary">
              Ir al feed →
            </button>
          )}
        </>
      )}
    </div>
  );
}

function TabChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-3.5 py-1.5 text-[13px] font-bold",
        active
          ? "border border-primary bg-primary text-primary-foreground"
          : "border border-card-border bg-background text-foreground hover:bg-background-secondary",
      ].join(" ")}>
      {label}
    </button>
  );
}
