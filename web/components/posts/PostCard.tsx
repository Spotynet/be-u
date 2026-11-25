"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ContentActions} from "@/components/moderation/ContentActions";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {loginHref} from "@/lib/authGate";
import {
  postAuthorAvatar,
  postAuthorName,
  postAuthorProfileId,
  postAuthorUserId,
  postMediaUrls,
} from "@/lib/posts";


function typeLabel(raw?: string | null): string {
  const t = (raw || "post").toString().toLowerCase();
  if (t.includes("before")) return "Antes / Después";
  if (t.includes("carousel")) return "Carrusel";
  if (t.includes("mosaic")) return "Mosaico";
  if (t.includes("photo") || t.includes("image")) return "Foto";
  if (t.includes("video")) return "Video";
  if (t.includes("review")) return "Reseña";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function PostCard({
  post,
  onLike,
  onBlocked,
}: {
  post: any;
  onLike?: (id: number) => Promise<void> | void;
  onBlocked?: (userId: number) => void;
}) {
  const {isAuthenticated} = useAuth();
  const router = useRouter();
  const urls = postMediaUrls(post);
  const [slide, setSlide] = useState(0);
  const [liking, setLiking] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const authorName = postAuthorName(post);
  const profileId = postAuthorProfileId(post);
  const authorUserId = postAuthorUserId(post);
  const caption = post.content || post.caption || "";
  const liked = !!post.user_has_liked;
  const avatar = postAuthorAvatar(post);
  const activeUrl = urls[Math.min(slide, Math.max(urls.length - 1, 0))];
  const showMedia = Boolean(activeUrl) && !imgFailed;
  const profilePath = profileId ? `/profile/${profileId}` : null;

  const requireLogin = (next: string) => {
    router.push(loginHref(next));
  };

  const openProfile = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!profilePath) return;
    if (!isAuthenticated) {
      requireLogin(profilePath);
      return;
    }
    router.push(profilePath);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onLike || liking) return;
    setLiking(true);
    try {
      await onLike(post.id);
    } finally {
      setLiking(false);
    }
  };

  return (
    <article
      className="overflow-hidden rounded-[var(--r-card)] border border-card-border bg-card shadow-card">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          onClick={openProfile}
          className={[
            "h-10 w-10 shrink-0 rounded-full border-0 p-0 ring-2 ring-primary-light",
            avatar ? "" : "bg-gradient-to-br from-primary to-primary-dark",
            profilePath ? "cursor-pointer" : "cursor-default",
          ].join(" ")}
          style={
            avatar
              ? {background: `center/cover url(${avatar})`}
              : undefined
          }
          aria-label={profilePath ? `Ver perfil de ${authorName}` : undefined}
        />
        <div className="min-w-0 flex-1">
          {profilePath ? (
            <button
              type="button"
              onClick={openProfile}
              className="block w-full truncate border-0 bg-transparent p-0 text-left text-[14px] font-extrabold text-foreground">
              {authorName}
            </button>
          ) : (
            <span className="block truncate text-[14px] font-extrabold text-foreground">
              {authorName}
            </span>
          )}
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-foreground-muted">
            {typeLabel(post.post_type || post.type)}
          </div>
        </div>
        <ContentActions
          targetType="post"
          targetId={post.id}
          authorUserId={authorUserId}
          loginNext="/feed"
          onBlocked={onBlocked}
        />
      </div>

      <Link
        href={`/post/${post.id}`}
        className="block no-underline"
        style={{color: "inherit"}}>
        {urls.length > 0 && (
          <div
            className="relative bg-[var(--bg-frame)]"
            style={{aspectRatio: "4 / 5", maxHeight: 520}}>
            {showMedia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-light text-sm font-bold text-primary">
                Sin imagen
              </div>
            )}
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={(e) => {
                    e.preventDefault();
                    setImgFailed(false);
                    setSlide((s) => (s - 1 + urls.length) % urls.length);
                  }}
                  className="nabbi-postcard-nav nabbi-postcard-nav--left">
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={(e) => {
                    e.preventDefault();
                    setImgFailed(false);
                    setSlide((s) => (s + 1) % urls.length);
                  }}
                  className="nabbi-postcard-nav nabbi-postcard-nav--right">
                  ›
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {urls.map((_, i) => (
                    <span
                      key={i}
                      className={[
                        "h-1.5 rounded-full transition-all",
                        i === slide
                          ? "w-[18px] bg-secondary"
                          : "w-1.5 bg-white/55",
                      ].join(" ")}
                    />
                  ))}
                </div>
                <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white">
                  {slide + 1}/{urls.length}
                </div>
              </>
            )}
          </div>
        )}

        {caption ? (
          <p className="m-0 line-clamp-4 px-3.5 pt-3.5 text-[14px] leading-relaxed text-foreground">
            {caption}
          </p>
        ) : null}
      </Link>

      <div className="flex flex-wrap items-center gap-2 px-3.5 py-3.5">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-extrabold transition-colors disabled:opacity-60",
            liked
              ? "bg-error-light text-error"
              : "bg-background-secondary text-foreground-secondary",
          ].join(" ")}>
          <span aria-hidden>{liked ? "♥" : "♡"}</span>
          {post.likes_count ?? 0}
        </button>

        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center rounded-full bg-background-secondary px-3 py-2 text-[13px] font-extrabold text-foreground-secondary no-underline">
          Comentarios
          {post.comments_count != null ? ` · ${post.comments_count}` : ""}
        </Link>

        {profilePath ? (
          <button
            type="button"
            onClick={openProfile}
            className="nabbi-btn nabbi-btn-accent ml-auto !px-3.5 !py-2 !text-[13px]">
            Reservar
          </button>
        ) : null}
      </div>
    </article>
  );
}

