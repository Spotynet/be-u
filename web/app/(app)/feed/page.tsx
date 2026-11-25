"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {RectangleStackIcon} from "@heroicons/react/24/outline";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useFeed} from "@/features/posts/hooks/useFeed";
import {PostCard} from "@/components/posts/PostCard";
import {CategoryChipBar} from "@/components/marketplace";
import {
  CardHeader,
  PageHeaderRow,
  StackLayout,
} from "@/components/layout";
import {usePageHeader} from "@/components/shell/usePageHeader";
import {loginHref} from "@/lib/authGate";
import {postAuthorUserId} from "@/lib/posts";

export default function FeedPage() {
  const [category, setCategory] = useState<string>("");
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const {posts, loading, error, toggleLike} = useFeed(category || undefined);
  const {isAuthenticated} = useAuth();
  const router = useRouter();

  usePageHeader({title: "Feed", pageOwnsTitle: true});

  const requireLogin = (next: string) => {
    router.push(loginHref(next));
  };

  const handleLike = async (id: number) => {
    if (!isAuthenticated) {
      requireLogin("/feed");
      return;
    }
    await toggleLike(id);
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      requireLogin("/posts/create");
      return;
    }
    router.push("/posts/create");
  };

  const visiblePosts = posts.filter((post) => {
    const authorId = postAuthorUserId(post);
    return !authorId || !blockedUsers.includes(authorId);
  });

  return (
    <StackLayout>
      <PageHeaderRow
        title="Feed"
        description="Ideas, trabajos y novedades de profesionales y lugares en nabbi."
        actions={
          <button
            type="button"
            onClick={handleCreatePost}
            className="nabbi-btn nabbi-btn-accent shrink-0 !px-4 !py-2.5 !text-[13px]">
            Crear post
          </button>
        }
      />

      <section className="rounded-[var(--card-radius)] border border-card-border bg-card p-[var(--card-pad)] shadow-card">
        <CardHeader
          title="Categorías"
          icon={RectangleStackIcon}
          actions={
            <span className="rounded-full bg-primary-light px-2.5 py-1 text-[12px] font-bold tabular-nums text-primary-dark">
              {loading ? "…" : `${visiblePosts.length}`}
            </span>
          }
        />
        <div className="mt-3">
          <CategoryChipBar
            value={category}
            onChange={setCategory}
            allLabel="Todas"
            surface="card"
            padInline="0"
          />
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[var(--card-radius)] border border-card-border bg-card"
                aria-hidden>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="h-10 w-10 rounded-full bg-primary-light" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-primary-light" />
                    <div className="h-2.5 w-1/4 rounded bg-background" />
                  </div>
                </div>
                <div className="aspect-[4/5] max-h-[420px] bg-primary-light" />
                <div className="space-y-2 p-3.5">
                  <div className="h-3 w-4/5 rounded bg-primary-light" />
                  <div className="h-3 w-2/5 rounded bg-background" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[var(--tile-radius)] border border-error/40 bg-error/10 p-4 text-sm font-semibold text-error">
            {error}
          </div>
        ) : null}

        {!loading && !error && visiblePosts.length === 0 ? (
          <div className="rounded-[var(--card-radius)] border border-dashed border-card-border bg-card px-6 py-10 text-center">
            <p className="m-0 text-[16px] font-extrabold text-foreground">
              Aún no hay publicaciones
            </p>
            <p className="mt-2 mb-5 text-sm leading-relaxed text-foreground-secondary">
              Sé el primero en compartir un trabajo, tip o novedad con la
              comunidad.
            </p>
            <button
              type="button"
              onClick={handleCreatePost}
              className="nabbi-btn nabbi-btn-primary inline-flex">
              Crear la primera
            </button>
          </div>
        ) : null}

        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onBlocked={(userId) =>
              setBlockedUsers((prev) => [...prev, userId])
            }
          />
        ))}
      </div>
    </StackLayout>
  );
}
