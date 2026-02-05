import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProfileCustomization} from "@/features/profile/hooks/useProfileCustomization";
import * as ImagePicker from "expo-image-picker";
import {compressImages} from "@/lib/imageUtils";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface ImageGalleryProps {
  maxImages?: number;
}

export const ImageGallery = ({maxImages = 10}: ImageGalleryProps) => {
  const {colors} = useThemeVariant();
  const {data, isLoading, uploadImage, deleteImage, refetch} = useProfileCustomization();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number; total: number} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const images = data.images || [];

  const requestPermissions = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería para subir imágenes.", [
        {text: "OK"},
      ]);
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (images.length >= maxImages) {
      Alert.alert("Límite alcanzado", `Solo puedes subir hasta ${maxImages} imágenes.`, [
        {text: "OK"},
      ]);
      return;
    }

    const remaining = Math.max(0, maxImages - images.length);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // Multi-select for faster gallery uploads. (Editing is not compatible with multi-select.)
      allowsMultipleSelection: remaining > 1,
      selectionLimit: remaining, // iOS 14+; ignored where unsupported
      allowsEditing: remaining <= 1,
      aspect: remaining <= 1 ? [4, 3] : undefined,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setUploading(true);
      setUploadProgress({current: 0, total: 0});
      try {
        const pickedUris = result.assets.map((a) => a.uri).slice(0, remaining);
        const compressedUris = await compressImages(pickedUris);

        // Upload sequentially to keep server load predictable and preserve ordering.
        setUploadProgress({current: 0, total: compressedUris.length});
        for (let i = 0; i < compressedUris.length; i++) {
          setUploadProgress({current: i + 1, total: compressedUris.length});
          await uploadImage(compressedUris[i]);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    }
  };

  const removeImage = (imageIndex: number) => {
    console.log("removeImage called with index:", imageIndex);
    setDeleteConfirmIndex(imageIndex);
  };

  const confirmDelete = async () => {
    if (deleteConfirmIndex === null) return;
    
    const index = deleteConfirmIndex;
    setDeleteConfirmIndex(null);
    
    try {
      console.log("Deleting image at index:", index);
      setDeleting(true);
      await deleteImage(index);
      console.log("Image deleted successfully, refreshing...");
      // Refresh data after deletion
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      Alert.alert("Error", "No se pudo eliminar la imagen. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmIndex(null);
  };

  const openImageModal = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const renderImageGrid = () => {
    const imageSize = (SCREEN_WIDTH - 60) / 3; // 3 columns with padding

    return (
      <View style={styles.imageGrid}>
        {images.map((image, index) => (
          <View
            key={image.id || index}
            style={[styles.imageContainer, {width: imageSize, height: imageSize}]}>
            <TouchableOpacity
              style={styles.imageTouchable}
              onPress={() => openImageModal(image.image)}
              activeOpacity={0.9}>
              <Image source={{uri: image.image}} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeButton, {backgroundColor: colors.primary}]}
              onPress={(event) => {
                event?.stopPropagation?.();
                console.log("Delete button clicked for index:", index);
                removeImage(index);
              }}
              onPressIn={(event) => {
                event?.stopPropagation?.();
                console.log("Delete button pressed IN for index:", index);
              }}
              onPressOut={(event) => {
                event?.stopPropagation?.();
              }}
              activeOpacity={0.7}
              hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
              <View style={styles.removeButtonContent}>
                <Ionicons name="close" color="#ffffff" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity
            style={[
              styles.addImageButton,
              {
                width: imageSize,
                height: imageSize,
                backgroundColor: colors.muted,
                borderColor: colors.border,
              },
            ]}
            onPress={pickImage}
            activeOpacity={0.7}
            disabled={uploading}>
            {uploading ? (
              <View style={styles.uploadingTile}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={[styles.addImageText, {color: colors.mutedForeground}]}>
                  {uploadProgress?.total ? `${uploadProgress.current}/${uploadProgress.total}` : "Subiendo"}
                </Text>
              </View>
            ) : (
              <>
                <Ionicons name="add" color={colors.mutedForeground} size={32} />
                <Text style={[styles.addImageText, {color: colors.mutedForeground}]}>Agregar</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando imágenes...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.foreground}]}>
          Galería de Imágenes ({images.length}/{maxImages})
        </Text>
        {!!uploadProgress && uploadProgress.total > 0 && (
          <Text style={[styles.progressText, {color: colors.mutedForeground}]}>
            Subiendo {uploadProgress.current}/{uploadProgress.total}...
          </Text>
        )}
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Agrega imágenes de tu trabajo para mostrar a los clientes
        </Text>
      </View>

      {images.length === 0 ? (
        <View style={[styles.emptyState, {backgroundColor: colors.muted}]}>
          <Ionicons name="images-outline" color={colors.mutedForeground} size={64} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay imágenes</Text>
          <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
            Agrega imágenes de tu trabajo para atraer más clientes
          </Text>
          <TouchableOpacity
            style={[styles.addButton, {backgroundColor: colors.primary}]}
            onPress={pickImage}
            activeOpacity={0.9}
            disabled={uploading}>
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.addButtonText}>
                  {uploadProgress?.total ? `Subiendo ${uploadProgress.current}/${uploadProgress.total}` : "Subiendo..."}
                </Text>
              </View>
            ) : (
              <>
                <Ionicons name="camera" color="#ffffff" size={20} />
                <Text style={styles.addButtonText}>Agregar Primera Imagen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        renderImageGrid()
      )}

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmIndex !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, {backgroundColor: colors.card}]}>
            <Text style={[styles.confirmTitle, {color: colors.foreground}]}>
              Eliminar imagen
            </Text>
            <Text style={[styles.confirmMessage, {color: colors.mutedForeground}]}>
              ¿Estás seguro que deseas eliminar esta imagen?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, {borderColor: colors.border}]}
                onPress={cancelDelete}
                activeOpacity={0.7}>
                <Text style={[styles.confirmButtonText, {color: colors.foreground}]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton, {backgroundColor: "#ef4444"}]}
                onPress={confirmDelete}
                activeOpacity={0.7}
                disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonTextWhite}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={closeImageModal} />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeImageModal}>
              <Ionicons name="close" color="#ffffff" size={24} />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{uri: selectedImage}} style={styles.modalImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "visible",
  },
  imageTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  removeButtonContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageButton: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadingTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    position: "relative",
  },
  modalCloseButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  confirmModal: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: "90%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonTextWhite: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
