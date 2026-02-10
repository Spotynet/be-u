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
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState, useRef, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {postApi, errorUtils, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";

export default function CreatePhotoPostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [customServices, setCustomServices] = useState<CustomServiceItem[]>([]);
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(null);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

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
    if (!isAuthenticated || !user) {
      Alert.alert("Error", "Debes iniciar sesión para publicar");
      router.push("/login");
      return;
    }

    if (photos.length === 0) {
      Alert.alert("Error", "Agrega al menos una foto");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Agrega una descripción");
      return;
    }

    try {
      setIsUploading(true);
      console.log("📤 Starting post creation with", photos.length, "photos");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("content", description);
      formData.append("post_type", "photo");
      if (linkedServiceId != null) {
        formData.append("linked_service_id", String(linkedServiceId));
      }

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
      const response = await postApi.createPhotoPost(formData);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (error: any) {
      console.error("❌ Error creating post - Full error object:", JSON.stringify(error, null, 2));
      console.error("❌ Error response status:", error?.response?.status);
      console.error("❌ Error response data:", error?.response?.data);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error status:", error?.status);
      
      // Use errorUtils for consistent error message extraction
      const errorMessage = errorUtils.getErrorMessage(error);
      console.error("📢 Showing error to user:", errorMessage);
      
      Alert.alert("Error", errorMessage);
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
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Foto</Text>
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
        {/* Media Uploader */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Foto</Text>
          <MediaUploader
            mediaType="photo"
            maxFiles={1}
            onMediaSelected={setPhotos}
            selectedMedia={photos}
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
              {
                backgroundColor: colors.inputBackground,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="¿Qué quieres compartir?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
            onFocus={() => {
              // Scroll to the description section when keyboard appears
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
              }, 100);
            }}
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
            <Ionicons name="checkmark-circle" color="#ffffff" size={24} />
          )}
          <Text style={styles.publishButtonLargeText}>
            {isUploading ? "Publicando..." : "Publicar Ahora"}
          </Text>
        </TouchableOpacity>

        {/* Extra space when keyboard is visible */}
        <View style={{height: keyboardHeight > 0 ? keyboardHeight + 40 : 40}} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
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
    backgroundColor: "#4ECDC4",
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
