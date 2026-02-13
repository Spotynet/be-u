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
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {useState, useRef, useEffect} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {postApi, errorUtils, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AppHeader} from "@/components/ui/AppHeader";

export default function CreatePhotoPostScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <AppHeader
        title="Foto"
        showBackButton={true}
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: 24}]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Media Uploader */}
          <MediaUploader
            mediaType="photo"
            maxFiles={1}
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
            <Text style={[styles.fieldLabel, {color: colors.foreground}]}>DESCRIPCIÓN</Text>
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
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({animated: true});
                }, 100);
              }}
            />
          </View>

          {/* Extra space when keyboard is visible */}
          <View style={{height: keyboardHeight > 0 ? keyboardHeight : 0}} />
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
