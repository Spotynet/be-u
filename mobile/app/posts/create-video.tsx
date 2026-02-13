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

export default function CreateVideoPostScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {isAuthenticated} = useAuth();

  const [videos, setVideos] = useState<string[]>([]);
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
    if (videos.length === 0) {
      Alert.alert("Error", "Agrega un video");
      return;
    }

    try {
      setIsUploading(true);

      // Create FormData for file upload
      const formData = new FormData();

      // Add post_type field (required by backend)
      formData.append("post_type", "video");

      // Description (optional)
      if (description.trim()) {
        formData.append("content", description.trim());
      }
      if (linkedServiceId != null) formData.append("linked_service_id", String(linkedServiceId));

      // Add video to FormData
      if (Platform.OS === "web") {
        // On web, convert URI to Blob/File object
        const videoUri = videos[0];
        const res = await fetch(videoUri);
        const blob = await res.blob();
        const mimeType = blob.type || "video/mp4";
        const ext = (mimeType.split("/")[1] || "mp4");
        const file = new File([blob], `video_${Date.now()}.${ext}`, {type: mimeType});
        formData.append("media", file);
      } else {
        // On native, use the React Native file descriptor
        const videoUri = videos[0];
        const uriParts = videoUri.split(".");
        const fileType = uriParts[uriParts.length - 1] || "mp4";
        const rnFile = {
          uri: videoUri,
          type: `video/${fileType}`,
          name: `video_${Date.now()}.${fileType}`,
        } as any;
        formData.append("media", rnFile);
      }

      // Call the API
      const response = await postApi.createVideoPost(formData);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (error: any) {
      console.error("Error creating video post:", error);
      const errorMessage = error?.response?.data 
        ? JSON.stringify(error.response.data)
        : error?.message || "No se pudo publicar el video";
      console.error("Error details:", errorMessage);
      Alert.alert("Error", `No se pudo publicar el video: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Video"
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
          mediaType="video"
          maxFiles={1}
          onMediaSelected={setVideos}
          selectedMedia={videos}
        />

        <LinkedServiceSelector
          customServices={customServices}
          linkedServiceId={linkedServiceId}
          onSelect={setLinkedServiceId}
          colors={colors}
        />

        {/* Description */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, {color: colors.foreground}]}>DESCRIPCIÓN</Text>
          <TextInput
            style={[
              styles.descriptionInput,
              {backgroundColor: colors.input, color: colors.foreground},
            ]}
            placeholder="Escribe algo sobre este trabajo..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={{height: 24}} />
      </ScrollView>

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
    fontSize: 15,
    minHeight: 110,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 110,
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


