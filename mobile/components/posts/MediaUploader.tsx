import {View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
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
          // Compress images before returning them
          const compressedUris = await Promise.all(
            result.assets.map((asset) => compressImage(asset.uri))
          );
          const updatedMedia = [...selectedMedia, ...compressedUris].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } catch (error) {
          console.error("Error compressing images:", error);
          // Fallback to original images if compression fails
          const newMedia = result.assets.map((asset) => asset.uri);
          const updatedMedia = [...selectedMedia, ...newMedia].slice(0, maxFiles);
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
          // Compress image before returning it
          const compressedUri = await compressImage(result.assets[0].uri);
          const updatedMedia = [...selectedMedia, compressedUri].slice(0, maxFiles);
          onMediaSelected(updatedMedia);
        } catch (error) {
          console.error("Error compressing image:", error);
          // Fallback to original image if compression fails
          const newMedia = result.assets.map((asset) => asset.uri);
          const updatedMedia = [...selectedMedia, ...newMedia].slice(0, maxFiles);
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

  return (
    <View style={styles.container}>
      {/* Selected Media Grid */}
      {selectedMedia.length > 0 && (
        <View style={styles.mediaGrid}>
          {selectedMedia.map((uri, index) => (
            <View key={index} style={[styles.mediaItem, {backgroundColor: colors.muted}]}>
              <Image source={{uri}} style={styles.mediaImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMedia(index)}
                activeOpacity={0.8}>
                <Ionicons name="close-circle" color="#ffffff" size={24} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload Buttons */}
      {canAddMore && (
        <View style={styles.uploadButtons}>
          {mediaType !== "video" && (
            <TouchableOpacity
              style={[
                styles.uploadButton,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}
              onPress={takePhoto}
              activeOpacity={0.8}
              disabled={uploading}>
              <View style={[styles.uploadIcon, {backgroundColor: colors.primary + "15"}]}>
                <Ionicons name="camera" color={colors.primary} size={24} />
              </View>
              <Text style={[styles.uploadButtonText, {color: colors.foreground}]}>Cámara</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.uploadButton,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}
            onPress={pickMedia}
            activeOpacity={0.8}
            disabled={uploading}>
            <View style={[styles.uploadIcon, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="images" color={colors.primary} size={24} />
            </View>
            <Text style={[styles.uploadButtonText, {color: colors.foreground}]}>Galería</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Progress */}
      {uploading && (
        <View style={[styles.uploadingOverlay, {backgroundColor: colors.background + "E6"}]}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {backgroundColor: colors.primary}]} />
          </View>
          <Text style={[styles.uploadingText, {color: colors.foreground}]}>Subiendo... 75%</Text>
        </View>
      )}

      {/* Info Text */}
      <Text style={[styles.infoText, {color: colors.mutedForeground}]}>
        {mediaType === "photo"
          ? `Puedes agregar hasta ${maxFiles} fotos`
          : mediaType === "video"
          ? "Selecciona un video (máx. 60 seg)"
          : `Puedes agregar hasta ${maxFiles} archivos`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
  },
  uploadButtons: {
    flexDirection: "row",
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    gap: 12,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: "600",
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
  infoText: {
    fontSize: 13,
    textAlign: "center",
  },
});
