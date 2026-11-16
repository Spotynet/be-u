"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useFeed} from "@/features/posts/hooks/useFeed";
import {PostCard} from "@/components/posts/PostCard";
import {CategoryChipBar, SectionHeader} from "@/components/marketplace";

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
    <div className="nabbi-page mx-auto w-full max-w-[1100px]">
      <SectionHeader
        title="Feed"
        subtitle="Descubre lo que pasa en nabbi."
        action={
          <Link
            href="/posts/create"
            className="whitespace-nowrap rounded-xl bg-secondary px-4 py-2.5 text-sm font-extrabold text-secondary-foreground no-underline">
            + Crear
          </Link>
        }
      />

      <div className="mb-5">
        <CategoryChipBar
          value={category}
          onChange={setCategory}
          allLabel="Todas"
        />
      </div>

      {loading && <p className="text-foreground-muted">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-600">
          {error}
        </div>
      )}
      {!loading && !error && visiblePosts.length === 0 && (
        <p className="text-foreground-muted">
          Aún no hay publicaciones.{" "}
          <Link href="/posts/create" className="font-bold text-primary">
            Crea la primera
          </Link>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
