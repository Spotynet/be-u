"use client";

import {useState} from "react";
import Link from "next/link";
import {ContentActions} from "@/components/moderation/ContentActions";

const INK = "#12211A";
const MAIN = "#558367";

function mediaUrls(post: any): string[] {
  const media = post.media || post.images || post.media_files || [];
  if (Array.isArray(media) && media.length) {
    return media
      .map((m: any) => (typeof m === "string" ? m : m.url || m.image || m.file))
      .filter(Boolean);
  }
  if (post.image) return [post.image];
  if (post.cover_image) return [post.cover_image];
  if (post.before && post.after) return [post.before, post.after].filter(Boolean);
  return [];
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
  const urls = mediaUrls(post);
  const [slide, setSlide] = useState(0);
  const [liking, setLiking] = useState(false);
  const authorName = post.author_name || post.author?.name || post.user_name || "Usuario";
  const profileId = post.author_profile_id || post.author_public_profile_id || post.public_profile_id;
  const authorUserId = Number(post.author || post.author_id || post.user || post.user_id) || null;
  const caption = post.content || post.caption || "";
  const liked = !!post.user_has_liked;

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
      style={{
        background: "white",
        borderRadius: 18,
        border: "1px solid rgba(18,33,26,0.08)",
        overflow: "hidden",
      }}>
      <div style={{padding: "12px 14px", display: "flex", alignItems: "center", gap: 10}}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${MAIN}, #1F3328)`,
            backgroundImage: post.author_avatar || post.author_image
              ? `url(${post.author_avatar || post.author_image})`
              : undefined,
            backgroundSize: "cover",
          }}
        />
        <div style={{flex: 1, minWidth: 0}}>
          {profileId ? (
            <Link
              href={`/profile/${profileId}`}
              style={{color: INK, fontWeight: 800, textDecoration: "none", fontSize: 14}}>
              {authorName}
            </Link>
          ) : (
            <span style={{color: INK, fontWeight: 800, fontSize: 14}}>{authorName}</span>
          )}
          <div style={{fontSize: 11, color: "#94a3b8", fontWeight: 600}}>
            {(post.post_type || post.type || "post").toString()}
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

      <Link href={`/post/${post.id}`} style={{display: "block", textDecoration: "none", color: "inherit"}}>
        {urls.length > 0 && (
          <div style={{position: "relative", background: "#0f1a15", aspectRatio: "4/5", maxHeight: 480}}>
            <img
              src={urls[Math.min(slide, urls.length - 1)]}
              alt=""
              style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
            />
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSlide((s) => (s - 1 + urls.length) % urls.length);
                  }}
                  style={navBtnStyle("left")}>
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSlide((s) => (s + 1) % urls.length);
                  }}
                  style={navBtnStyle("right")}>
                  ›
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 12,
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}>
                  {slide + 1}/{urls.length}
                </div>
              </>
            )}
          </div>
        )}
        {caption && (
          <p style={{margin: 0, padding: "12px 14px 4px", color: INK, fontSize: 14, lineHeight: 1.5}}>
            {caption}
          </p>
        )}
      </Link>

      <div style={{padding: "8px 14px 14px", display: "flex", alignItems: "center", gap: 12}}>
        <button
          type="button"
          onClick={handleLike}
          disabled={liking}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 14,
            color: liked ? "#e11d48" : "#64748b",
          }}>
          {liked ? "♥" : "♡"} {post.likes_count ?? 0}
        </button>
        <Link href={`/post/${post.id}`} style={{color: "#64748b", fontWeight: 700, fontSize: 14, textDecoration: "none"}}>
          Comentarios
        </Link>
      </div>
    </article>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.45)",
    color: "white",
    fontSize: 20,
    cursor: "pointer",
    lineHeight: 1,
  };
}
