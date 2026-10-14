"use client";

import {useCallback, useEffect, useState} from "react";
import {postApi, errorUtils} from "@/lib/api";

export function useFeed(category?: string) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postApi.getPosts({
        category: category || undefined,
        page: 1,
      });
      const results = res.data.results || [];
      // Defer video-heavy stories; keep photo/carousel/other as cards
      setPosts(results.filter((p: any) => (p.post_type || p.type) !== "video"));
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async (postId: number) => {
    const res = await postApi.likePost(postId);
    const liked = res.data?.liked ?? res.data?.user_has_liked;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasLiked = !!p.user_has_liked;
        const nextLiked = typeof liked === "boolean" ? liked : !wasLiked;
        const delta = nextLiked === wasLiked ? 0 : nextLiked ? 1 : -1;
        return {
          ...p,
          user_has_liked: nextLiked,
          likes_count: Math.max(0, (p.likes_count || 0) + delta),
        };
      })
    );
    return res.data;
  };

  return {posts, loading, error, reload: load, toggleLike, setPosts};
}
