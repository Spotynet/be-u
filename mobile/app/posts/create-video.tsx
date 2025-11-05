import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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

export default function CreateVideoPostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

      // Call the API - video posts don't have content/description
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

        {/* Expiration Notice */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <View style={styles.expirationNotice}>
            <Ionicons name="time-outline" color="#FF6B6B" size={24} />
            <View style={styles.expirationTextContainer}>
              <Text style={[styles.expirationTitle, {color: colors.foreground}]}>
                Expira en 24 horas
              </Text>
              <Text style={[styles.expirationDescription, {color: colors.mutedForeground}]}>
                Este video desaparecerá del feed después de 24 horas, similar a las stories de
                Instagram.
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Configuración</Text>

          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble-outline" color={colors.foreground} size={20} />
              <Text style={[styles.settingText, {color: colors.foreground}]}>
                Permitir comentarios
              </Text>
            </View>
            <View style={[styles.toggle, styles.toggleActive, {backgroundColor: colors.primary}]}>
              <View style={[styles.toggleCircle, styles.toggleCircleActive]} />
            </View>
          </TouchableOpacity>
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
  expirationNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  expirationTextContainer: {
    flex: 1,
    gap: 4,
  },
  expirationTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  expirationDescription: {
    fontSize: 13,
    lineHeight: 18,
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
    backgroundColor: "#FF6B6B",
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


