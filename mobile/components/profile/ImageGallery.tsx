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

const {width: SCREEN_WIDTH} = Dimensions.get("window");

interface ImageGalleryProps {
  maxImages?: number;
}

export const ImageGallery = ({maxImages = 10}: ImageGalleryProps) => {
  const {colors} = useThemeVariant();
  const {data, isLoading, uploadImage, deleteImage} = useProfileCustomization();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        await uploadImage(result.assets[0].uri);
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const removeImage = (imageId: number) => {
    Alert.alert("Eliminar imagen", "¿Estás seguro que deseas eliminar esta imagen?", [
      {text: "Cancelar", style: "cancel"},
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteImage(imageId);
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        },
      },
    ]);
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
        {images.map((image) => (
          <View
            key={image.id}
            style={[styles.imageContainer, {width: imageSize, height: imageSize}]}>
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => openImageModal(image.image)}
              activeOpacity={0.9}>
              <Image source={{uri: image.image}} style={styles.image} />
              <TouchableOpacity
                style={[styles.removeButton, {backgroundColor: colors.primary}]}
                onPress={() => removeImage(image.id)}
                activeOpacity={0.8}>
                <Ionicons name="close" color="#ffffff" size={16} />
              </TouchableOpacity>
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
              <ActivityIndicator color={colors.primary} size="small" />
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
              <ActivityIndicator color="#ffffff" size="small" />
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
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageContainer: {
    position: "relative",
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
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
});
