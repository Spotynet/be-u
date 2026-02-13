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
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {postApi, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AppHeader} from "@/components/ui/AppHeader";

export default function CreateCarouselScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {isAuthenticated} = useAuth();

  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [customServices, setCustomServices] = useState<CustomServiceItem[]>([]);
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    profileCustomizationApi.getCustomServices()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        setCustomServices(list.map((s: any) => ({
          id: s.id,
          name: s.name || s.service_name || "",
          price: s.price != null ? String(s.price) : "",
          duration_minutes: s.duration_minutes,
        })));
      })
      .catch(() => { if (!cancelled) setCustomServices([]); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handlePublish = async () => {
    if (photos.length === 0) {
      Alert.alert("Error", "Agrega al menos una foto");
      return;
    }

    if (photos.length > 5) {
      Alert.alert("Error", "El carrusel puede tener máximo 5 fotos");
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      if (description.trim()) {
        formData.append("content", description);
      }
      formData.append("post_type", "carousel");
      // Hidden setting: default to allow comments
      formData.append("allow_comments", "true");
      if (linkedServiceId != null) formData.append("linked_service_id", String(linkedServiceId));

      // Add photos to FormData
      if (Platform.OS === "web") {
        // On web, convert URIs to Blob/File objects
        await Promise.all(
          photos.map(async (photoUri, index) => {
            const res = await fetch(photoUri);
            const blob = await res.blob();
            const mimeType = blob.type || "image/jpeg";
            const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
            const file = new File([blob], `photo_${Date.now()}_${index}.${ext}`, {type: mimeType});
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
            name: `photo_${Date.now()}_${index}.${fileType}`,
          } as any;
          formData.append("media", rnFile);
        });
      }

      // Call the API
      const response = await postApi.createCarouselPost(formData);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (error: any) {
      console.error("Error creating carousel post:", error);
      
      // Handle 413 error specifically
      if (error?.response?.status === 413 || error?.status === 413) {
        Alert.alert(
          "Archivo muy grande",
          "Las imágenes son demasiado grandes. Por favor, intenta con imágenes más pequeñas o comprime las imágenes antes de subirlas."
        );
        return;
      }
      
      // Handle other errors
      let errorMessage = "No se pudo publicar el carrusel";
      if (error?.response?.data) {
        const data = error.response.data;
        // Check if it's an HTML error response (like from Nginx)
        if (typeof data === "string" && data.includes("413")) {
          errorMessage = "Las imágenes son demasiado grandes. Por favor, intenta con imágenes más pequeñas.";
        } else if (data.detail || data.error || data.message) {
          errorMessage = data.detail || data.error || data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Carrusel"
        showBackButton={true}
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 100}]}
        showsVerticalScrollIndicator={false}>
        <MediaUploader
          mediaType="photo"
          maxFiles={5}
          onMediaSelected={setPhotos}
          selectedMedia={photos}
        />

        <LinkedServiceSelector
          customServices={customServices}
          linkedServiceId={linkedServiceId}
          onSelect={setLinkedServiceId}
          colors={colors}
        />

        {/* Description */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, {color: colors.foreground}]}>
            DESCRIPCIÓN (OPCIONAL)
          </Text>
          <TextInput
            style={[
              styles.descriptionInput,
              {
                backgroundColor: colors.input,
                color: colors.foreground,
              },
            ]}
            placeholder="Escribe algo sobre este trabajo..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Publish Button (Fixed Bottom) */}
      <View
        style={[
          styles.fixedBottomContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <TouchableOpacity
          style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
          onPress={handlePublish}
          activeOpacity={0.8}
          disabled={isUploading || photos.length === 0}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : null}
          <Text style={styles.publishButtonLargeText}>
            {isUploading ? "Publicando..." : "Publicar en el feed"}
          </Text>
          {!isUploading && <Ionicons name="arrow-forward" color="#ffffff" size={22} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  descriptionInput: {
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: "top",
  },
  fixedBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  publishButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  publishButtonLargeText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

