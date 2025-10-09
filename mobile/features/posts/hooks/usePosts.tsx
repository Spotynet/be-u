import {useState, useEffect, useCallback} from "react";
import {postApi, errorUtils} from "@/lib/api";
import {Post} from "@/types/global";
import {Alert} from "react-native";

export const usePosts = (authorId?: number) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(
    async (refresh = false) => {
      try {
        setIsLoading(true);
        setError(null);
        const currentPage = refresh ? 1 : page;
        const params: any = {page: currentPage};
        if (authorId) params.author = authorId;

        const response = await postApi.getPosts(params);
        const newPosts = response.data.results || [];

        if (refresh) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        setHasMore(newPosts.length > 0);
        if (refresh) setPage(2);
        else setPage((prev) => prev + 1);
      } catch (err) {
        const message = errorUtils.getErrorMessage(err);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [authorId, page]
  );

  useEffect(() => {
    fetchPosts(true);
  }, [authorId]);

  const likePost = async (postId: number) => {
    try {
      await postApi.likePost(postId);
      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? {...post, is_liked: true, likes_count: post.likes_count + 1} : post
        )
      );
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
    }
  };

  const unlikePost = async (postId: number) => {
    try {
      await postApi.unlikePost(postId);
      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {...post, is_liked: false, likes_count: Math.max(0, post.likes_count - 1)}
            : post
        )
      );
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
    }
  };

  const deletePost = async (postId: number) => {
    try {
      await postApi.deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      Alert.alert("Éxito", "Publicación eliminada");
    } catch (err) {
      const message = errorUtils.getErrorMessage(err);
      Alert.alert("Error", message);
    }
  };

  return {
    posts,
    isLoading,
    error,
    hasMore,
    likePost,
    unlikePost,
    deletePost,
    refreshPosts: () => fetchPosts(true),
    loadMore: () => fetchPosts(false),
  };
};
