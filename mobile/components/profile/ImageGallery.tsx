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
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useProfileCustomization} from "@/features/profile/hooks/useProfileCustomization";
import * as ImagePicker from "expo-image-picker";
import {compressImages} from "@/lib/imageUtils";
import {errorUtils} from "@/lib/api";

const {width: SCREEN_WIDTH} = Dimensions.get("window");
const API_BASE_URL = "https://stg.be-u.ai/api";

// Helper function to convert relative URLs to absolute URLs
const getAbsoluteImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // If it's a relative URL, prepend the API base URL
  if (url.startsWith("/")) {
    return `${API_BASE_URL.replace("/api", "")}${url}`;
  }
  return `${API_BASE_URL.replace("/api", "")}/${url}`;
};

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
    // Web doesn't require permissions - browser handles it via file input
    if (Platform.OS === "web") {
      return true;
    }

    // Check current permission status first
    const {status: currentStatus} = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    // If already granted, return true
    if (currentStatus === "granted") {
      return true;
    }

    // Request permission
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos requeridos",
        "Necesitamos acceso a tu galería para subir imágenes. Por favor, permite el acceso en la configuración de la aplicación.",
        [{text: "OK"}]
      );
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

    try {
      // Configure picker options based on platform and remaining slots
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      };

      // Multi-select configuration
      if (remaining > 1) {
        // Enable multi-select when we can select multiple images
        pickerOptions.allowsMultipleSelection = true;
        // selectionLimit works on iOS 14+ and Android, ignored on web (browser handles it)
        pickerOptions.selectionLimit = remaining;
        // Editing is not compatible with multi-select
        pickerOptions.allowsEditing = false;
      } else {
        // Single image selection - allow editing
        pickerOptions.allowsMultipleSelection = false;
        pickerOptions.allowsEditing = true;
        pickerOptions.aspect = [4, 3];
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets?.length) {
        setUploading(true);
        setUploadProgress({current: 0, total: 0});
        
        try {
          // Extract URIs from selected assets, respecting the limit
          const pickedUris = result.assets
            .map((a) => a.uri)
            .slice(0, remaining)
            .filter((uri) => uri); // Filter out any null/undefined URIs

          if (pickedUris.length === 0) {
            Alert.alert("Error", "No se pudieron obtener las imágenes seleccionadas.");
            return;
          }

          // Compress images (handles web, iOS, and Android)
          let compressedUris: string[];
          try {
            compressedUris = await compressImages(pickedUris);
          } catch (compressError) {
            console.warn("Compression failed, using original images:", compressError);
            // Fallback to original URIs if compression fails
            compressedUris = pickedUris;
          }

          // Upload sequentially to keep server load predictable and preserve ordering
          setUploadProgress({current: 0, total: compressedUris.length});
          
          for (let i = 0; i < compressedUris.length; i++) {
            try {
              setUploadProgress({current: i, total: compressedUris.length});
              await uploadImage(compressedUris[i]);
              setUploadProgress({current: i + 1, total: compressedUris.length});
            } catch (uploadError) {
              console.error(`Error uploading image ${i + 1}/${compressedUris.length}:`, uploadError);
              // Continue with next image even if one fails
              const errorMessage = errorUtils?.getErrorMessage?.(uploadError) || "Error al subir la imagen";
              if (i === 0 && compressedUris.length === 1) {
                // If it's the only image, show error
                Alert.alert("Error", errorMessage);
              } else {
                // For multiple images, log but continue
                console.warn(`Failed to upload image ${i + 1}, continuing with others...`);
              }
            }
          }

          // Refresh the image list after successful uploads
          if (refetch) {
            await refetch();
          }
        } catch (error) {
          console.error("Error processing images:", error);
          const errorMessage = errorUtils?.getErrorMessage?.(error) || "Error al procesar las imágenes";
          Alert.alert("Error", errorMessage);
        } finally {
          setUploading(false);
          setUploadProgress(null);
        }
      }
    } catch (error) {
      console.error("Error launching image picker:", error);
      Alert.alert("Error", "No se pudo abrir la galería de imágenes. Inténtalo de nuevo.");
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
        {images.map((image, index) => {
          const imageUrl = getAbsoluteImageUrl(image.image);
          
          return (
            <View
              key={image.id || index}
              style={[styles.imageContainer, {width: imageSize, height: imageSize}]}>
              <TouchableOpacity
                style={styles.imageTouchable}
                onPress={() => imageUrl && openImageModal(imageUrl)}
                activeOpacity={0.9}>
                {imageUrl ? (
                  <Image 
                    source={{uri: imageUrl}} 
                    style={styles.image}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error("Error loading image:", error.nativeEvent.error, "URL:", imageUrl);
                    }}
                  />
                ) : (
                  <View style={[styles.imagePlaceholder, {backgroundColor: colors.muted}]}>
                    <Ionicons name="image-outline" color={colors.mutedForeground} size={32} />
                  </View>
                )}
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
          );
        })}

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
    marginHorizontal: -5,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "visible",
    margin: 5,
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
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
