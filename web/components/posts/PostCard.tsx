"use client";

import {useState} from "react";
import Link from "next/link";
import {ContentActions} from "@/components/moderation/ContentActions";
import {
  postAuthorAvatar,
  postAuthorName,
  postAuthorProfileId,
  postAuthorUserId,
  postMediaUrls,
} from "@/lib/posts";

const INK = "#12211A";
const MAIN = "#558367";
const MUTED = "#3d6050";
const SOFT = "#5a7d6a";

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
      className="overflow-hidden rounded-[18px] border border-[#ccd8ce] bg-white shadow-[0_10px_28px_-16px_rgba(18,33,26,0.28)]">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full ring-2 ring-[#d8eae0]"
          style={{
            background: avatar
              ? `center/cover url(${avatar})`
              : `linear-gradient(135deg, ${MAIN}, #1F3328)`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {profileId ? (
            <Link
              href={`/profile/${profileId}`}
              className="block truncate text-[14px] font-extrabold no-underline"
              style={{color: INK}}>
              {authorName}
            </Link>
          ) : (
            <span className="block truncate text-[14px] font-extrabold" style={{color: INK}}>
              {authorName}
            </span>
          )}
          <div className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{color: SOFT}}>
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
            className="relative bg-[#0f1a15]"
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
              <div
                className="flex h-full w-full items-center justify-center text-sm font-bold"
                style={{background: "#d8eae0", color: MAIN}}>
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
                  style={navBtnStyle("left")}>
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
                  style={navBtnStyle("right")}>
                  ›
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {urls.map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === slide ? 18 : 6,
                        background: i === slide ? "#F6C531" : "rgba(255,255,255,0.55)",
                      }}
                    />
                  ))}
                </div>
                <div
                  className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                  style={{background: "rgba(0,0,0,0.55)"}}>
                  {slide + 1}/{urls.length}
                </div>
              </>
            )}
          </div>
        )}

        {caption ? (
          <p
            className="m-0 line-clamp-4 px-3.5 pt-3.5 text-[14px] leading-relaxed"
            style={{color: INK}}>
            {caption}
          </p>
        ) : null}
      </Link>

      <div className="flex flex-wrap items-center gap-2 px-3.5 py-3.5">
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-extrabold transition-colors disabled:opacity-60"
          style={{
            background: liked ? "#ffe4e6" : "#e8efe9",
            color: liked ? "#be123c" : MUTED,
          }}>
          <span aria-hidden>{liked ? "♥" : "♡"}</span>
          {post.likes_count ?? 0}
        </button>

        <Link
          href={`/post/${post.id}`}
          className="inline-flex items-center rounded-full px-3 py-2 text-[13px] font-extrabold no-underline"
          style={{background: "#e8efe9", color: MUTED}}>
          Comentarios
          {post.comments_count != null ? ` · ${post.comments_count}` : ""}
        </Link>

        {profileId ? (
          <Link
            href={`/profile/${profileId}`}
            className="nabbi-btn nabbi-btn-accent ml-auto !px-3.5 !py-2 !text-[13px]">
            Reservar
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 10,
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "none",
    background: "rgba(18,33,26,0.55)",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    lineHeight: 1,
    backdropFilter: "blur(4px)",
  };
}
