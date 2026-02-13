import {View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState} from "react";
import * as ImagePicker from "expo-image-picker";
import {compressImage} from "@/lib/imageUtils";

interface MediaUploaderProps {
  mediaType: "photo" | "video" | "any";
  maxFiles?: number;
  onMediaSelected: (media: string[]) => void;
  selectedMedia?: string[];
}

export function MediaUploader({
  mediaType = "photo",
  maxFiles = 10,
  onMediaSelected,
  selectedMedia = [],
}: MediaUploaderProps) {
  const {colors} = useThemeVariant();
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    try {
      // First check current permission status
      const {status: currentStatus} = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      let finalStatus = currentStatus;
      
      // Request permission if not already granted
      if (currentStatus !== "granted") {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permisos requeridos",
          "Necesitamos acceso a tu galería para seleccionar fotos. Por favor, permite el acceso a la galería en la configuración de la aplicación.",
          [{text: "OK"}]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          mediaType === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : mediaType === "photo"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: maxFiles > 1,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        try {
          const compressedUris = await Promise.all(
            result.assets.map((asset) => compressImage(asset.uri))
          );
          const atMax = selectedMedia.length >= maxFiles;
          const updatedMedia = atMax
            ? compressedUris.slice(0, maxFiles)
            : [...selectedMedia, ...compressedUris].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } catch (error) {
          console.error("Error compressing images:", error);
          const newMedia = result.assets.map((asset) => asset.uri);
          const atMax = selectedMedia.length >= maxFiles;
          const updatedMedia = atMax
            ? newMedia.slice(0, maxFiles)
            : [...selectedMedia, ...newMedia].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo");
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      // First check current permission status
      const {status: currentStatus} = await ImagePicker.getCameraPermissionsAsync();
      
      let finalStatus = currentStatus;
      
      // Request permission if not already granted
      if (currentStatus !== "granted") {
        const {status} = await ImagePicker.requestCameraPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== "granted") {
        Alert.alert(
          "Permisos requeridos",
          "Necesitamos acceso a tu cámara para tomar fotos. Por favor, permite el acceso a la cámara en la configuración de la aplicación.",
          [{text: "OK"}]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        try {
          const compressedUri = await compressImage(result.assets[0].uri);
          const atMax = selectedMedia.length >= maxFiles;
          const updatedMedia = atMax
            ? [compressedUri]
            : [...selectedMedia, compressedUri].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } catch (error) {
          console.error("Error compressing image:", error);
          const newMedia = result.assets.map((asset) => asset.uri);
          const atMax = selectedMedia.length >= maxFiles;
          const updatedMedia = atMax
            ? newMedia.slice(0, maxFiles)
            : [...selectedMedia, ...newMedia].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "No se pudo tomar la foto. Por favor, intenta de nuevo.");
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    const updatedMedia = selectedMedia.filter((_, i) => i !== index);
    onMediaSelected(updatedMedia);
  };

  const canAddMore = selectedMedia.length < maxFiles;

  const onDropZonePress = () => {
    if (uploading) return;
    if (Platform.OS === "web") {
      pickMedia();
      return;
    }
    if (mediaType === "video") {
      pickMedia();
      return;
    }
    Alert.alert("Seleccionar", "Elige una opción", [
      {text: "Galería", onPress: pickMedia},
      {text: "Cámara", onPress: takePhoto},
      {text: "Cancelar", style: "cancel"},
    ]);
  };

  const mainLabel =
    mediaType === "video"
      ? "Seleccionar Video"
      : mediaType === "photo"
      ? "Seleccionar Foto"
      : "Seleccionar Foto o Video";

  const hasSelection = selectedMedia.length > 0;
  const firstUri = selectedMedia[0];

  return (
    <View style={styles.container}>
      {/* Un solo bloque: placeholder O preview, mismo tamaño */}
      <View style={[styles.selectorCard, {backgroundColor: colors.card}]}>
        {hasSelection ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDropZonePress}
            style={[styles.previewContainer, {backgroundColor: colors.primary + "08"}]}>
            <Image source={{uri: firstUri}} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                removeMedia(0);
              }}
              activeOpacity={0.8}>
              <Ionicons name="close-circle" color="#ffffff" size={28} />
            </TouchableOpacity>
            {selectedMedia.length > 1 && (
              <View style={[styles.moreBadge, {backgroundColor: colors.primary}]}>
                <Text style={styles.moreBadgeText}>+{selectedMedia.length - 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDropZonePress}
            style={[
              styles.dropZone,
              {
                borderColor: colors.primary + "80",
                backgroundColor: colors.primary + "08",
              },
            ]}>
            <View style={styles.dropZoneIconWrap}>
              <Ionicons name="camera" color={colors.primary} size={48} />
              <View style={[styles.dropZoneBadge, {backgroundColor: colors.primary}]}>
                <Ionicons name="add" color="#FFFFFF" size={16} />
              </View>
            </View>
            <Text style={[styles.dropZoneTitle, {color: colors.foreground}]}>{mainLabel}</Text>
            <Text style={[styles.dropZoneSubtitle, {color: colors.mutedForeground}]}>
              Alta resolución recomendada
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Progress */}
      {uploading && (
        <View style={[styles.uploadingOverlay, {backgroundColor: colors.background + "E6"}]}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {backgroundColor: colors.primary}]} />
          </View>
          <Text style={[styles.uploadingText, {color: colors.foreground}]}>Subiendo... 75%</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  selectorCard: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 0,
    gap: 20,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    minHeight: 200,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  previewContainer: {
    borderRadius: 16,
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  moreBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  dropZoneIconWrap: {
    position: "relative",
  },
  dropZoneBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropZoneSubtitle: {
    fontSize: 13,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    borderRadius: 16,
  },
  progressBar: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: 4,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
