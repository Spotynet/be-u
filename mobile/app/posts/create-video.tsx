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
import {useState, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {postApi, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";

export default function CreateVideoPostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
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
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Video</Text>
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
        {/* Video Uploader */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Video</Text>
          <MediaUploader
            mediaType="video"
            maxFiles={1}
            onMediaSelected={setVideos}
            selectedMedia={videos}
          />
        </View>

        <LinkedServiceSelector
          customServices={customServices}
          linkedServiceId={linkedServiceId}
          onSelect={setLinkedServiceId}
          colors={colors}
        />

        {/* Description */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Descripción</Text>
          <TextInput
            style={[
              styles.textArea,
              {backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground},
            ]}
            placeholder="Escribe una descripción..."
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Publish Button (Bottom) */}
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
          ) : (
            <Ionicons name="videocam" color="#ffffff" size={24} />
          )}
          <Text style={styles.publishButtonLargeText}>
            {isUploading ? "Publicando..." : "Publicar Video"}
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 110,
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


