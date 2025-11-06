import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {postApi} from "@/lib/api";

export default function CreatePetAdoptionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [photos, setPhotos] = useState<string[]>([]);
  const [petName, setPetName] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePublish = async () => {
    if (photos.length === 0) {
      Alert.alert("Error", "Agrega al menos una foto de la mascota");
      return;
    }

    if (!petName.trim()) {
      Alert.alert("Error", "Ingresa el nombre de la mascota");
      return;
    }

    if (!petDescription.trim()) {
      Alert.alert("Error", "Agrega una descripción de la mascota");
      return;
    }

    if (!contactInfo.trim()) {
      Alert.alert("Error", "Agrega información de contacto");
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Build content with pet information
      const contentParts = [
        `🐾 ${petName}`,
        petAge ? `Edad: ${petAge}` : "",
        petBreed ? `Raza: ${petBreed}` : "",
        "",
        petDescription,
        "",
        `📞 Contacto: ${contactInfo}`,
      ].filter(Boolean);
      
      formData.append("content", contentParts.join("\n"));
      formData.append("post_type", "pet_adoption");

      // Add photos to FormData
      if (Platform.OS === "web") {
        // On web, convert URIs to Blob/File objects
        await Promise.all(
          photos.map(async (photoUri, index) => {
            const res = await fetch(photoUri);
            const blob = await res.blob();
            const mimeType = blob.type || "image/jpeg";
            const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
            const file = new File([blob], `pet_${Date.now()}_${index}.${ext}`, {type: mimeType});
            formData.append("media", file);
          })
        );
      } else {
        // On native, use the React Native file descriptor
        photos.forEach((photoUri, index) => {
          const uriParts = photoUri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          const rnFile = {
            uri: photoUri,
            type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
            name: `pet_${Date.now()}_${index}.${fileType}`,
          } as any;
          formData.append("media", rnFile);
        });
      }

      // Call the API
      const response = await postApi.createPetAdoptionPost(formData);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (error: any) {
      console.error("Error creating pet adoption post:", error);
      const errorMessage = error?.response?.data 
        ? JSON.stringify(error.response.data)
        : error?.message || "No se pudo publicar la mascota";
      Alert.alert("Error", `No se pudo publicar: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Adoptar Mascotas</Text>
        <TouchableOpacity
          onPress={handlePublish}
          style={styles.publishButton}
          disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.publishButtonText, {color: colors.primary}]}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Photos Uploader */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Fotos de la Mascota
          </Text>
          <MediaUploader
            mediaType="photo"
            maxFiles={5}
            onMediaSelected={setPhotos}
            selectedMedia={photos}
          />
        </View>

        {/* Pet Information */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Información de la Mascota
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Nombre *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Ej: Max, Luna..."
              placeholderTextColor={colors.mutedForeground}
              value={petName}
              onChangeText={setPetName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Edad (Opcional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Ej: 2 años, 6 meses..."
              placeholderTextColor={colors.mutedForeground}
              value={petAge}
              onChangeText={setPetAge}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Raza (Opcional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Ej: Golden Retriever, Siames..."
              placeholderTextColor={colors.mutedForeground}
              value={petBreed}
              onChangeText={setPetBreed}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Descripción *</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Describe la mascota, su personalidad, necesidades especiales..."
              placeholderTextColor={colors.mutedForeground}
              value={petDescription}
              onChangeText={setPetDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Información de Contacto *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Teléfono, email o WhatsApp"
              placeholderTextColor={colors.mutedForeground}
              value={contactInfo}
              onChangeText={setContactInfo}
            />
          </View>
        </View>

        {/* Publish Button (Bottom) */}
        <TouchableOpacity
          style={[
            styles.publishButtonLarge,
            {
              backgroundColor: isUploading || photos.length === 0 || !petName.trim() || !petDescription.trim() || !contactInfo.trim()
                ? colors.muted
                : colors.primary,
            },
          ]}
          onPress={handlePublish}
          activeOpacity={0.8}
          disabled={isUploading || photos.length === 0 || !petName.trim() || !petDescription.trim() || !contactInfo.trim()}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="paw" color="#ffffff" size={24} />
          )}
          <Text style={styles.publishButtonLargeText}>
            {isUploading ? "Publicando..." : "Publicar Mascota"}
          </Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  publishButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: "top",
  },
  publishButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    marginTop: 8,
  },
  publishButtonLargeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});

