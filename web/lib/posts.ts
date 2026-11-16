/** Helpers for Django PostSerializer payloads (same fields as mobile). */

export function postMediaUrls(post: any): string[] {
  const media = post?.media || post?.images || post?.media_files || [];
  if (Array.isArray(media) && media.length) {
    return media
      .map((m: any) => {
        if (typeof m === "string") return m;
        return (
          m?.media_url ||
          m?.media_file ||
          m?.url ||
          m?.image ||
          m?.file ||
          null
        );
      })
      .filter(Boolean);
  }
  if (post?.image) return [post.image];
  if (post?.cover_image) return [post.cover_image];
  if (post?.before || post?.after) {
    return [post.before, post.after].filter(Boolean);
  }
  return [];
}

export function postAuthorUserId(post: any): number | null {
  const raw =
    (post?.author && typeof post.author === "object" ? post.author.id : post?.author) ??
    post?.author_id ??
    post?.user_id ??
    (post?.user && typeof post.user === "object" ? post.user.id : post?.user);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function postAuthorName(post: any): string {
  const fromFields =
    post?.author_display_name ||
    post?.author_name ||
    post?.user_name ||
    null;
  if (fromFields) return String(fromFields);

  const author = post?.author;
  if (author && typeof author === "object") {
    const full = [author.first_name, author.last_name].filter(Boolean).join(" ").trim();
    if (full) return full;
    if (author.username) return String(author.username);
    if (author.name) return String(author.name);
  }

  return "Usuario";
}

export function postAuthorAvatar(post: any): string | null {
  return (
    post?.author_photo ||
    post?.author_avatar ||
    post?.author_image ||
    post?.author?.avatar ||
    post?.author?.photo ||
    null
  );
}

export function postAuthorProfileId(post: any): number | null {
  const raw =
    post?.author_profile_id ||
    post?.author_public_profile_id ||
    post?.public_profile_id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
