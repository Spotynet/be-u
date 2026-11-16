"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useFeed} from "@/features/posts/hooks/useFeed";
import {PostCard} from "@/components/posts/PostCard";
import {CategoryChipBar} from "@/components/marketplace";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("");
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const {posts, loading, error, toggleLike} = useFeed(category || undefined);
  const {isAuthenticated} = useAuth();
  const router = useRouter();

  const handleLike = async (id: number) => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/feed")}`);
      return;
    }
    await toggleLike(id);
  };

  const visiblePosts = posts.filter((post) => {
    const authorId = Number(post.author || post.author_id || post.user || post.user_id);
    return !authorId || !blockedUsers.includes(authorId);
  });

  return (
    <div className="nabbi-page mx-auto w-full max-w-[820px]">
      <div className="mb-4 overflow-hidden rounded-[22px] border border-[#ccd8ce] bg-gradient-to-br from-[#1f3328] via-[#2a4638] to-[#558367] px-4 py-5 text-white shadow-[0_16px_40px_-18px_rgba(18,33,26,0.45)] sm:px-5">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">
          Comunidad
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(1.45rem,4vw,1.9rem)] font-black tracking-tight text-white">
              Feed
            </h1>
            <p className="mt-1.5 mb-0 max-w-xl text-[14px] leading-relaxed text-white/80">
              Ideas, trabajos y novedades de profesionales y lugares en nabbi.
            </p>
          </div>
          <Link
            href="/posts/create"
            className="nabbi-btn nabbi-btn-accent shrink-0 !px-4 !py-2.5 !text-[13px]">
            + Crear post
          </Link>
        </div>
      </div>

      <div className="sticky top-[68px] z-20 mb-4 rounded-[20px] border border-[#ccd8ce] bg-white/95 px-3 py-3 shadow-[0_10px_30px_-18px_rgba(18,33,26,0.35)] backdrop-blur-md sm:px-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="m-0 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#3d6050]">
            Categorías
          </p>
          <span className="rounded-full bg-[#e8efe9] px-2.5 py-1 text-[12px] font-bold text-[#1f3328]">
            {loading ? "…" : `${visiblePosts.length} posts`}
          </span>
        </div>
        <CategoryChipBar
          value={category}
          onChange={setCategory}
          allLabel="Todas"
        />
      </div>

      {loading && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[18px] border border-[#ccd8ce] bg-white"
              aria-hidden>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div className="h-10 w-10 rounded-full bg-[#e8efe9]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-[#e8efe9]" />
                  <div className="h-2.5 w-1/4 rounded bg-[#f3f6f4]" />
                </div>
              </div>
              <div className="aspect-[4/5] max-h-[420px] bg-[#e8efe9]" />
              <div className="space-y-2 p-3.5">
                <div className="h-3 w-4/5 rounded bg-[#e8efe9]" />
                <div className="h-3 w-2/5 rounded bg-[#f3f6f4]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-[#fca5a5] bg-[#fef2f2] p-4 text-sm font-semibold text-[#b91c1c]">
          {error}
        </div>
      )}

      {!loading && !error && visiblePosts.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-[#ccd8ce] bg-white px-6 py-10 text-center">
          <p className="m-0 text-[16px] font-extrabold text-[#12211a]">
            Aún no hay publicaciones
          </p>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-[#3d6050]">
            Sé el primero en compartir un trabajo, tip o novedad con la comunidad.
          </p>
          <Link href="/posts/create" className="nabbi-btn nabbi-btn-primary inline-flex">
            Crear la primera
          </Link>
        </div>
      )}

      <div className="mx-auto flex max-w-[640px] flex-col gap-4">
        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onBlocked={(userId) => setBlockedUsers((prev) => [...prev, userId])}
          />
        ))}
      </div>
    </div>
  );
}
