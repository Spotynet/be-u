import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import { postApi } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { getAvatarColorFromSubcategory } from "@/constants/categories";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeVariant();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostDetail();
    }
  }, [id]);

  const fetchPostDetail = async () => {
    try {
      setIsLoading(true);
      
      // Fetch post details
      const response = await postApi.getPost(Number(id));
      const postData = response.data;
      
      setPost(postData);
      setIsLiked(postData.has_liked || postData.is_liked || false);
      setLikesCount(postData.likes_count || 0);
      
      // Fetch comments separately
      try {
        const commentsResponse = await postApi.getComments(Number(id));
        setComments(commentsResponse.data.results || commentsResponse.data || []);
      } catch (commentsError) {
        console.log("No comments available:", commentsError);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching post detail:", error);
      Alert.alert("Error", "No se pudo cargar el post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para dar like");
      return;
    }

    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      await postApi.likePost(Number(id));
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async () => {
    if (!user) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para comentar");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await postApi.createComment(Number(id), newComment.trim());
      
      // Add the new comment to the list
      const newCommentData = {
        id: response.data.id || Date.now(),
        author_name: user.first_name || user.email || "Usuario",
        text: newComment.trim(),
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        ...response.data,
      };
      setComments(prev => [...prev, newCommentData]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "No se pudo agregar el comentario");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.foreground }]}>Post no encontrado</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mediaUrl = post.media && post.media.length > 0
    ? (typeof post.media[0] === 'string' ? post.media[0] : post.media[0]?.media_file)
    : post.image_url;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Publicación</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Author Info */}
        <View style={[styles.authorSection, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={() => {
              if (post.author_profile_id) {
                router.push(`/profile/${post.author_profile_id}`);
              }
            }}>
            <View
              style={[
                styles.authorAvatar,
                {
                  backgroundColor: getAvatarColorFromSubcategory(
                    post.author_category,
                    post.author_subcategories || []
                  ),
                },
              ]}>
              <Text style={styles.authorAvatarText}>
                {(post.author_display_name || post.author?.email || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.authorDetails}>
              <Text style={[styles.authorName, { color: colors.foreground }]}>
                {post.author_display_name || post.author?.email || "Usuario"}
              </Text>
              {post.created_at && (
                <Text style={[styles.postDate, { color: colors.mutedForeground }]}>
                  {new Date(post.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Post Image */}
        {mediaUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: mediaUrl }} style={styles.postImage} resizeMode="cover" />
          </View>
        )}

        {/* Action Bar */}
        <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#EF4444" : colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={26} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Likes Count */}
        <View style={styles.likesSection}>
          <Text style={[styles.likesText, { color: colors.foreground }]}>
            {likesCount} {likesCount === 1 ? "me gusta" : "me gusta"}
          </Text>
        </View>

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionSection}>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              <Text style={styles.captionAuthor}>
                {post.author_display_name || post.author?.email || "Usuario"}{" "}
              </Text>
              {post.caption}
            </Text>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
            Comentarios ({comments.length})
          </Text>

          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <View key={comment.id || index} style={styles.commentItem}>
                <View
                  style={[
                    styles.commentAvatar,
                    { backgroundColor: colors.primary + "20" },
                  ]}>
                  <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
                    {(comment.author_name || "U").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={[styles.commentAuthor, { color: colors.foreground }]}>
                    {comment.author_name || "Usuario"}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.foreground }]}>
                    {comment.text || comment.content}
                  </Text>
                  {comment.created_at && (
                    <Text style={[styles.commentDate, { color: colors.mutedForeground }]}>
                      {new Date(comment.created_at).toLocaleDateString("es-ES")}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.noComments, { color: colors.mutedForeground }]}>
              No hay comentarios aún. ¡Sé el primero en comentar!
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Comment Input */}
      {user && (
        <View
          style={[
            styles.commentInputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View
            style={[
              styles.commentAvatar,
              { backgroundColor: colors.primary + "20" },
            ]}>
            <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
              {(user.first_name || user.email || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.card,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Agrega un comentario..."
            placeholderTextColor={colors.mutedForeground}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                opacity: newComment.trim() && !isSubmitting ? 1 : 0.5,
              },
            ]}
            onPress={handleComment}
            disabled={!newComment.trim() || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="send" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  authorSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  authorAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  postDate: {
    fontSize: 13,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  likesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  likesText: {
    fontSize: 15,
    fontWeight: "600",
  },
  captionSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
  },
  captionAuthor: {
    fontWeight: "600",
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
  },
  noComments: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 16,
    marginTop: 8,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

