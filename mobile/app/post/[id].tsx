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
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeVariant } from "@/contexts/ThemeVariantContext";
import { postApi } from "@/lib/api";
import { useAuth } from "@/features/auth";
import { getAvatarColorFromSubcategory } from "@/constants/categories";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id, liked: likedParam } = useLocalSearchParams<{ id: string; liked?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeVariant();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(likedParam === "true");
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsPopupPosition, setOptionsPopupPosition] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const optionsButtonRef = useRef<View | null>(null);

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
      // When opened from Favorites we pass liked=true; always show heart marked for favorites
      setIsLiked(likedParam === "true" || !!postData.has_liked || !!postData.is_liked);
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

  const handleOpenEditModal = () => {
    setEditContent(post.content || post.caption || "");
    setIsEditModalVisible(true);
  };

  const handleSavePostEdit = async () => {
    if (!id) return;
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await postApi.updatePost(Number(id), {content: editContent});
      setPost((prev) => (prev ? {...prev, content: editContent, caption: editContent} : null));
      setIsEditModalVisible(false);
    } catch (e) {
      console.error("Edit post error:", e);
      Alert.alert("Error", "No se pudo editar el post");
    } finally {
      setIsSavingEdit(false);
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
      
      // Add the new comment to the list (show username, not email)
      const newCommentData = {
        id: response.data.id || Date.now(),
        author_name: user.username || user.first_name || "Usuario",
        author_username: user.username,
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

  const allMedia = post.media || [];
  const mediaUrl = allMedia.length > 0
    ? (typeof allMedia[0] === "string" ? allMedia[0] : allMedia[0]?.media_file || allMedia[0]?.media_url)
    : post.image_url;
  const isBeforeAfter = post.post_type === "before_after";
  const beforeMedia = allMedia.find((m: any) => m.order === 0 || m.caption === "before");
  const afterMedia = allMedia.find((m: any) => m.order === 1 || m.caption === "after");
  const beforeUrl = typeof beforeMedia === "string" ? beforeMedia : beforeMedia?.media_file || beforeMedia?.media_url;
  const afterUrl = typeof afterMedia === "string" ? afterMedia : afterMedia?.media_file || afterMedia?.media_url;

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
        {user && post.author?.id === user.id ? (
          <View ref={(el) => { optionsButtonRef.current = el; }} collapsable={false}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                const ref = optionsButtonRef.current;
                if (ref?.measureInWindow) {
                  ref.measureInWindow((x, y, w, h) => {
                    setOptionsPopupPosition({ x, y, w, h });
                    setShowOptionsModal(true);
                  });
                } else {
                  setShowOptionsModal(true);
                  setOptionsPopupPosition(null);
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="ellipsis-vertical" color={colors.foreground} size={22} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerButton} />
        )}
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

        {/* Post Image o Antes/Después */}
        {isBeforeAfter && beforeUrl && afterUrl ? (
          <View style={styles.transformationContainer}>
            <View style={styles.transformationHalf}>
              <Image source={{ uri: beforeUrl }} style={styles.transformationImg} resizeMode="cover" />
              <View style={[styles.transformationLabel, styles.transformationLabelLeft]}>
                <Text style={styles.transformationLabelText}>ANTES</Text>
              </View>
            </View>
            <View style={styles.transformationHalf}>
              <Image source={{ uri: afterUrl }} style={styles.transformationImg} resizeMode="cover" />
              <View style={[styles.transformationLabel, styles.transformationLabelRight]}>
                <Text style={styles.transformationLabelText}>DESPUÉS</Text>
              </View>
            </View>
            <View style={styles.transformationDividerLine} />
            <View style={styles.transformationDividerDiamond} />
          </View>
        ) : mediaUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: mediaUrl }} style={styles.postImage} resizeMode="cover" />
          </View>
        ) : null}

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
            <TouchableOpacity
              style={[styles.reserveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const isOwnPost = user?.id != null && post.author?.id === user.id;
                if (isOwnPost) return;
                if (!user) {
                  Alert.alert(
                    "Inicia sesión",
                    "Necesitas iniciar sesión para reservar.",
                    [{text: "OK", onPress: () => router.push("/login")}]
                  );
                  return;
                }
                if (post.linked_service_id != null && post.linked_provider_id != null && post.linked_service_name) {
                  router.push({
                    pathname: "/booking",
                    params: {
                      serviceInstanceId: String(post.linked_service_id),
                      serviceTypeId: String(post.linked_service_id),
                      serviceName: post.linked_service_name,
                      serviceType: post.linked_service_type || "professional_service",
                      providerId: String(post.linked_provider_id),
                      providerName: post.author_display_name || "",
                      price: post.linked_service_price != null ? String(post.linked_service_price) : "",
                      duration: post.linked_service_duration_minutes != null ? String(post.linked_service_duration_minutes) : "60",
                    },
                  } as any);
                } else if (post.author_public_profile_id || post.author_profile_id) {
                  router.push(`/profile/${post.author_public_profile_id || post.author_profile_id}` as any);
                }
              }}>
              <Text style={styles.reserveButtonText}>Reservar</Text>
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
        {(post.content || post.caption) && (
          <View style={styles.captionSection}>
            <Text style={[styles.caption, { color: colors.foreground }]}>
              <Text style={styles.captionAuthor}>
                {post.author_display_name || post.author?.email || "Usuario"}{" "}
              </Text>
              {post.content || post.caption}
            </Text>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.foreground }]}>
            Comentarios ({comments.length})
          </Text>

          {comments.length > 0 ? (
            comments.map((comment, index) => {
              const authorObj = comment.author;
              const displayName =
                authorObj?.username ||
                comment.author_username ||
                authorObj?.first_name ||
                comment.author_name ||
                "Usuario";
              const avatarUrl =
                comment.author_image ||
                (authorObj && "image" in authorObj ? (authorObj as any).image : null) ||
                (authorObj && "user_image" in authorObj ? (authorObj as any).user_image : null);
              const initial = (displayName || "U").charAt(0).toUpperCase();

              return (
                <View key={comment.id || index} style={styles.commentItem}>
                  <View
                    style={[
                      styles.commentAvatar,
                      { backgroundColor: avatarUrl ? "transparent" : colors.primary + "20" },
                    ]}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: typeof avatarUrl === "string" ? avatarUrl : (avatarUrl as any)?.url || "" }}
                        style={styles.commentAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
                        {initial}
                      </Text>
                    )}
                  </View>
                  <View style={styles.commentContent}>
                    <Text style={[styles.commentAuthor, { color: colors.foreground }]}>
                      {displayName}
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
              );
            })
          ) : (
            <Text style={[styles.noComments, { color: colors.mutedForeground }]}>
              No hay comentarios aún. ¡Sé el primero en comentar!
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Popup pequeño de opciones (justo debajo de los 3 puntos) */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowOptionsModal(false); setOptionsPopupPosition(null); }}>
        <Pressable style={styles.postOptionsOverlay} onPress={() => { setShowOptionsModal(false); setOptionsPopupPosition(null); }}>
          <Pressable
            style={[
              styles.postOptionsPopup,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: optionsPopupPosition ? optionsPopupPosition.y + optionsPopupPosition.h : Math.max(insets.top + 70, 90),
                right: optionsPopupPosition ? SCREEN_WIDTH - optionsPopupPosition.x - optionsPopupPosition.w : 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={[styles.postOptionsButton, { borderBottomWidth: 0 }]}
              onPress={() => {
                handleOpenEditModal();
                setShowOptionsModal(false);
                setOptionsPopupPosition(null);
              }}>
              <Ionicons name="create-outline" color={colors.foreground} size={18} />
              <Text style={[styles.postOptionsButtonText, { color: colors.foreground }]}>Editar texto</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para editar texto del post */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}>
        <Pressable
          style={styles.editModalOverlay}
          onPress={() => setIsEditModalVisible(false)}>
          <Pressable
            style={[styles.editModalContent, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.editModalTitle, { color: colors.foreground }]}>Editar texto</Text>
            <TextInput
              style={[
                styles.editModalInput,
                { color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Escribe el texto del post..."
              placeholderTextColor={colors.mutedForeground}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={2000}
              editable={!isSavingEdit}
            />
            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={[styles.editModalCancel, { borderColor: colors.border }]}
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSavingEdit}>
                <Text style={{ color: colors.foreground }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalSave, { backgroundColor: colors.primary }]}
                onPress={handleSavePostEdit}
                disabled={isSavingEdit}>
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.editModalSaveText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
              {
                backgroundColor: (user as any).image || (user as any).user_image
                  ? "transparent"
                  : colors.primary + "20",
              },
            ]}>
            {(user as any).image || (user as any).user_image ? (
              <Image
                source={{
                  uri:
                    (user as any).user_image ||
                    (typeof (user as any).image === "string"
                      ? (user as any).image
                      : (user as any).image?.url) ||
                    "",
                }}
                style={styles.commentAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={[styles.commentAvatarText, { color: colors.primary }]}>
                {(user.username || user.first_name || "U").charAt(0).toUpperCase()}
              </Text>
            )}
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
  transformationContainer: {
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  transformationHalf: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  transformationImg: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  transformationLabel: {
    position: "absolute",
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  transformationLabelLeft: {
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transformationLabelRight: {
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  transformationLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  transformationDividerLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#e5e7eb",
  },
  transformationDividerDiamond: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    backgroundColor: "#d1d5db",
    transform: [{ rotate: "45deg" }],
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
  reserveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reserveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
    overflow: "hidden",
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  postOptionsOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  postOptionsPopup: {
    position: "absolute",
    right: 16,
    minWidth: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  postOptionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderBottomWidth: 1,
  },
  postOptionsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  editModalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  editModalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  editModalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editModalSave: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  editModalSaveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

