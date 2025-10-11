import React, {useState} from "react";
import {View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";

interface PhotoUploaderProps {
  photo?: string;
  onPhotoChange: (uri: string | null) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({photo, onPhotoChange}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const {status: cameraStatus} = await ImagePicker.requestCameraPermissionsAsync();
      const {status: libraryStatus} = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permisos necesarios",
          "Necesitamos permisos de cámara y galería para continuar"
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (source: "camera" | "library") => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      setUploading(true);

      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo cargar la imagen");
    } finally {
      setUploading(false);
    }
  };

  const showOptions = () => {
    Alert.alert("Seleccionar foto", "Elige una opción", [
      {text: "Tomar foto", onPress: () => pickImage("camera")},
      {text: "Elegir de galería", onPress: () => pickImage("library")},
      {text: "Cancelar", style: "cancel"},
    ]);
  };

  const removePhoto = () => {
    Alert.alert("Eliminar foto", "¿Estás seguro de eliminar esta foto?", [
      {text: "Cancelar", style: "cancel"},
      {text: "Eliminar", style: "destructive", onPress: () => onPhotoChange(null)},
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.foreground}]}>Foto del servicio</Text>
      <Text style={[styles.hint, {color: colors.mutedForeground}]}>Opcional</Text>

      {photo ? (
        <View style={[styles.photoContainer, {borderColor: colors.border}]}>
          <Image source={{uri: photo}} style={styles.photo} />
          <View style={styles.photoOverlay}>
            <TouchableOpacity
              style={[styles.overlayButton, {backgroundColor: colors.primary}]}
              onPress={showOptions}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.overlayButton, {backgroundColor: "#ef4444"}]}
              onPress={removePhoto}>
              <Ionicons name="trash" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={showOptions}
          disabled={uploading}>
          <View style={[styles.uploadIcon, {backgroundColor: colors.primary + "20"}]}>
            <Ionicons name="camera" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.uploadText, {color: colors.foreground}]}>
            {uploading ? "Cargando..." : "Agregar foto"}
          </Text>
          <Text style={[styles.uploadHint, {color: colors.mutedForeground}]}>
            Toca para tomar una foto o elegir de la galería
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  photoContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  overlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  uploadHint: {
    fontSize: 13,
    textAlign: "center",
  },
});
