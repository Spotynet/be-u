import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {useState, useCallback} from "react";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import {useAuth} from "@/features/auth";
import {useUserProfile} from "@/features/users";

interface HeroImageOverlayProps {
  profileId: number;
  images: string[];
  onPhotoUploaded?: () => void;
}

export function HeroImageOverlay({profileId, images, onPhotoUploaded}: HeroImageOverlayProps) {
  const {colors} = useThemeVariant();
  const {refreshToken} = useAuth();
  const {refreshProfile} = useUserProfile();
  const [uploading, setUploading] = useState(false);

  const pickHeroImage = async () => {
    if (Platform.OS !== "web") {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        const formData = new FormData();
        if (Platform.OS === "web") {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const mimeType = blob.type || "image/jpeg";
          const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
          formData.append("photo", new File([blob], `photo.${ext}`, {type: mimeType}));
        } else {
          const uriParts = result.assets[0].uri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          formData.append(
            "photo",
            {uri: result.assets[0].uri, type: `image/${fileType}`, name: `photo.${fileType}`} as any
          );
        }
        await profileCustomizationApi.uploadProfileImage(formData);
        if (refreshToken) await refreshToken();
        await refreshProfile();
        onPhotoUploaded?.();
      } catch {
        Alert.alert("Error", "No se pudo subir la imagen.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveBanner = () => {
    if (images.length === 0) return;
    Alert.alert(
      "Eliminar imagen principal",
      "¿Quitar esta imagen del banner? Se usará la siguiente imagen de la galería.",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await profileCustomizationApi.deleteProfileImage(0);
              if (refreshToken) await refreshToken();
              await refreshProfile();
              onPhotoUploaded?.();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la imagen.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.heroOverlayActions}>
      <TouchableOpacity
        style={styles.heroActionBtn}
        activeOpacity={0.85}
        onPress={pickHeroImage}
        disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="camera" size={18} color="#ffffff" />
        )}
      </TouchableOpacity>
      {images.length > 0 && (
        <TouchableOpacity
          style={styles.heroActionBtn}
          activeOpacity={0.85}
          onPress={handleRemoveBanner}>
          <Ionicons name="trash-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

interface ImageGallerySectionProps {
  profileId: number;
  images: string[];
  onImagesChanged?: () => void;
}

export function ImageGallerySection({profileId, images, onImagesChanged}: ImageGallerySectionProps) {
  const {colors} = useThemeVariant();
  const {refreshToken} = useAuth();
  const {refreshProfile} = useUserProfile();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({current: 0, total: 0});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const MAX_IMAGES = 10;

  const pickImages = async () => {
    if (Platform.OS !== "web") {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería.");
        return;
      }
    }
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Alert.alert("Límite alcanzado", `Máximo ${MAX_IMAGES} imágenes.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      setUploadProgress({current: 0, total: result.assets.length});
      try {
        for (let i = 0; i < result.assets.length; i++) {
          setUploadProgress({current: i + 1, total: result.assets.length});
          const asset = result.assets[i];
          const formData = new FormData();
          if (Platform.OS === "web") {
            const res = await fetch(asset.uri);
            const blob = await res.blob();
            const mimeType = blob.type || "image/jpeg";
            const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
            formData.append("image", new File([blob], `image.${ext}`, {type: mimeType}));
          } else {
            const uriParts = asset.uri.split(".");
            const fileType = uriParts[uriParts.length - 1] || "jpg";
            formData.append(
              "image",
              {uri: asset.uri, type: `image/${fileType}`, name: `image.${fileType}`} as any
            );
          }
          await profileCustomizationApi.uploadGalleryImage(formData);
        }
        if (refreshToken) await refreshToken();
        await refreshProfile();
        onImagesChanged?.();
      } catch {
        Alert.alert("Error", "No se pudieron subir algunas imágenes.");
      } finally {
        setUploading(false);
        setUploadProgress({current: 0, total: 0});
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmIndex === null) return;
    try {
      await profileCustomizationApi.deleteProfileImage(deleteConfirmIndex);
      if (refreshToken) await refreshToken();
      await refreshProfile();
      onImagesChanged?.();
    } catch {
      Alert.alert("Error", "No se pudo eliminar la imagen.");
    } finally {
      setDeleteConfirmIndex(null);
    }
  };

  return (
    <View style={styles.gallerySection}>
      <View style={styles.galleryHeader}>
        <Text style={[styles.galleryTitle, {color: colors.foreground}]}>Galería</Text>
        <Text style={[styles.galleryCount, {color: colors.mutedForeground}]}>
          {images.length}/{MAX_IMAGES}
        </Text>
      </View>

      {images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryScroll}>
          {images.map((uri, index) => (
            <TouchableOpacity
              key={`${uri}-${index}`}
              style={styles.galleryThumbWrap}
              activeOpacity={0.85}
              onPress={() => setPreviewImage(uri)}>
              <Image source={{uri}} style={styles.galleryThumb} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.galleryDeleteBtn, {backgroundColor: colors.card}]}
                activeOpacity={0.8}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => setDeleteConfirmIndex(index)}>
                <Ionicons name="close" size={12} color={colors.foreground} />
              </TouchableOpacity>
              {index === 0 && (
                <View style={[styles.galleryBannerBadge, {backgroundColor: colors.primary}]}>
                  <Text style={styles.galleryBannerBadgeText}>Banner</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity
              style={[styles.galleryAddBtn, {backgroundColor: colors.muted, borderColor: colors.border}]}
              activeOpacity={0.8}
              onPress={pickImages}
              disabled={uploading}>
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="add" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={[styles.galleryEmptyAdd, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.8}
          onPress={pickImages}
          disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="images-outline" size={28} color={colors.primary} />
              <Text style={[styles.galleryEmptyAddText, {color: colors.primary}]}>
                Agregar imágenes
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {uploading && uploadProgress.total > 1 && (
        <Text style={[styles.galleryProgress, {color: colors.mutedForeground}]}>
          Subiendo {uploadProgress.current}/{uploadProgress.total}...
        </Text>
      )}

      <Modal visible={previewImage !== null} transparent animationType="fade">
        <TouchableOpacity
          style={styles.previewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}>
          {previewImage && (
            <Image source={{uri: previewImage}} style={styles.previewImage} resizeMode="contain" />
          )}
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={deleteConfirmIndex !== null} transparent animationType="fade">
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalCard, {backgroundColor: colors.card}]}>
            <Text style={[styles.deleteModalTitle, {color: colors.foreground}]}>Eliminar imagen</Text>
            <Text style={[styles.deleteModalText, {color: colors.mutedForeground}]}>
              ¿Estás seguro de que quieres eliminar esta imagen?
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalBtn, {backgroundColor: colors.muted}]}
                onPress={() => setDeleteConfirmIndex(null)}
                activeOpacity={0.8}>
                <Text style={[styles.deleteModalBtnText, {color: colors.foreground}]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalBtn, {backgroundColor: colors.destructive || "#DC2626"}]}
                onPress={confirmDelete}
                activeOpacity={0.8}>
                <Text style={styles.deleteModalBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface EmptyStateCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
}

export function EmptyStateCard({icon, title, description, ctaLabel, ctaRoute}: EmptyStateCardProps) {
  const {colors} = useThemeVariant();
  const router = useRouter();

  return (
    <View style={[styles.emptyCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
      <View style={[styles.emptyIconContainer, {backgroundColor: colors.primary + "10"}]}>
        <Ionicons name={icon} color={colors.primary} size={36} />
      </View>
      <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
        {title}
      </Text>
      <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
        {description}
      </Text>
      <TouchableOpacity
        style={[styles.emptyActionButton, {backgroundColor: colors.primary}]}
        onPress={() => router.push(ctaRoute as any)}
        activeOpacity={0.9}>
        <Ionicons name="add" color="#ffffff" size={18} />
        <Text style={styles.emptyActionText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface SectionActionLinkProps {
  route: string;
  label?: string;
}

export function SectionActionLink({route, label = "Gestionar"}: SectionActionLinkProps) {
  const {colors} = useThemeVariant();
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(route as any)}>
      <Text style={[styles.sectionActionLink, {color: colors.primary}]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heroOverlayActions: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  heroActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  gallerySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  galleryTitle: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  galleryCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  galleryScroll: {
    gap: 8,
    paddingRight: 20,
  },
  galleryThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  galleryThumb: {
    width: "100%",
    height: "100%",
  },
  galleryDeleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
  },
  galleryBannerBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  galleryBannerBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },
  galleryAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryEmptyAdd: {
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  galleryEmptyAddText: {
    fontSize: 14,
    fontWeight: "600",
  },
  galleryProgress: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "90%",
    height: "80%",
  },
  previewClose: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  deleteModalCard: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  deleteModalText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteModalBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    padding: 28,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  sectionActionLink: {
    fontSize: 13,
    fontWeight: "700",
  },
});
