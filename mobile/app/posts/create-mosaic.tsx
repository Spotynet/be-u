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

export default function CreateMosaicPostScreen() {
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

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      if (description.trim()) {
        formData.append("content", description);
      }
      formData.append("post_type", "mosaic");
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
      const response = await postApi.createMosaicPost(formData);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (error: any) {
      console.error("Error creating mosaic post:", error);
      const errorMessage = error?.response?.data 
        ? JSON.stringify(error.response.data)
        : error?.message || "No se pudo publicar el mosaico";
      console.error("Error details:", errorMessage);
      Alert.alert("Error", `No se pudo publicar el mosaico: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Mosaico"
        showBackButton={true}
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <MediaUploader
          mediaType="photo"
          maxFiles={4}
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
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        <View style={{height: 24}} />
      </ScrollView>

      {/* Botón Publicar fijo abajo */}
      <View
        style={[
          styles.fixedBottom,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <TouchableOpacity
          style={[
            styles.publishButtonLarge,
            {backgroundColor: isUploading ? colors.muted : colors.primary},
          ]}
          onPress={handlePublish}
          activeOpacity={0.8}
          disabled={isUploading}>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionalBadge: {
    fontSize: 12,
    fontStyle: "italic",
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
    fontSize: 15,
    minHeight: 120,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 15,
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ccc",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: "#FF8A65",
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  fixedBottom: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
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
});

