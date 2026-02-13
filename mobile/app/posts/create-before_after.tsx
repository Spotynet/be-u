import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react";
import * as ImagePicker from "expo-image-picker";
import {LinkedServiceSelector, type CustomServiceItem} from "@/components/posts/LinkedServiceSelector";
import {postApi, tokenUtils, errorUtils, profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {AppHeader} from "@/components/ui/AppHeader";

export default function CreateBeforeAfterScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {isAuthenticated} = useAuth();

  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState("");
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

  const pickImage = async (type: "before" | "after") => {
    try {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        if (type === "before") {
          setBeforePhoto(result.assets[0].uri);
        } else {
          setAfterPhoto(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const handlePublish = async () => {
    if (!beforePhoto || !afterPhoto) {
      Alert.alert("Error", "Agrega las fotos de Antes y Después");
      return;
    }
    try {
      const token = await tokenUtils.getToken();
      if (!token) {
        Alert.alert("Inicia sesión", "Necesitas iniciar sesión para publicar.");
        router.push("/login");
        return;
      }

      const form = new FormData();

      const buildFile = async (uri: string, name: string) => {
        if (Platform.OS === "web") {
          const res = await fetch(uri);
          const blob = await res.blob();
          return new File([blob], name, {type: blob.type || "image/jpeg"});
        }
        // React Native FormData format
        const ext = uri.split(".").pop() || "jpg";
        const filename = `${name}.${ext}`;
        return {
          uri,
          name: filename,
          type: `image/${ext === "jpg" ? "jpeg" : ext}`,
        } as any;
      };

      const beforeFile = await buildFile(beforePhoto, `before_${Date.now()}`);
      const afterFile = await buildFile(afterPhoto, `after_${Date.now()}`);

      form.append("before", beforeFile as any);
      form.append("after", afterFile as any);
      form.append("caption", description);
      form.append("post_type", "before_after");
      if (linkedServiceId != null) form.append("linked_service_id", String(linkedServiceId));

      await postApi.createBeforeAfterPost(form);

      // Navigate back to home/feed upon success
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Error", errorUtils.getErrorMessage?.(e) || e?.message || "No se pudo publicar");
    }
  };

  const renderPhotoCard = (type: "before" | "after", photo: string | null) => {
    const title = type === "before" ? "Antes" : "Después";
    const icon = type === "before" ? "arrow-back-circle" : "arrow-forward-circle";

    return (
      <View style={[styles.photoCard, {backgroundColor: colors.card}]}>
        <View style={styles.photoCardHeader}>
          <Ionicons name={icon as any} color={colors.primary} size={24} />
          <Text style={[styles.photoCardTitle, {color: colors.foreground}]}>{title}</Text>
        </View>

        <TouchableOpacity
          style={[styles.photoContainer, {borderColor: colors.border}]}
          onPress={() => pickImage(type)}
          activeOpacity={0.8}>
          {photo ? (
            <Image source={{uri: photo}} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" color={colors.mutedForeground} size={48} />
              <Text style={[styles.photoPlaceholderText, {color: colors.mutedForeground}]}>
                Agregar foto
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Antes/Después"
        showBackButton={true}
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Before/After Photos */}
        <View style={styles.photosRow}>
          {renderPhotoCard("before", beforePhoto)}
          {renderPhotoCard("after", afterPhoto)}
        </View>

        {/* Preview Comparison */}
        {beforePhoto && afterPhoto && (
          <View style={styles.comparisonWrapper}>
            <View style={styles.comparisonContainer}>
              <Image source={{uri: beforePhoto}} style={styles.comparisonImage} />
              <View style={styles.divider} />
              <Image source={{uri: afterPhoto}} style={styles.comparisonImage} />
            </View>
          </View>
        )}

        <LinkedServiceSelector
          customServices={customServices}
          linkedServiceId={linkedServiceId}
          onSelect={setLinkedServiceId}
          colors={colors}
        />

        {/* Description */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, {color: colors.foreground}]}>
            DESCRIPCIÓN DEL PROCESO
          </Text>
          <TextInput
            style={[
              styles.descriptionInput,
              {backgroundColor: colors.input, color: colors.foreground},
            ]}
            placeholder="Escribe algo sobre este trabajo..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
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
          style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
          onPress={handlePublish}
          activeOpacity={0.8}>
          <Text style={styles.publishButtonLargeText}>Publicar en el feed</Text>
          <Ionicons name="arrow-forward" color="#ffffff" size={22} />
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
  photosRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  photoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  photoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  photoCardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  photoContainer: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontWeight: "600",
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
    minHeight: 100,
  },
  comparisonWrapper: {
    marginBottom: 16,
  },
  comparisonContainer: {
    flexDirection: "row",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  comparisonImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  divider: {
    width: 2,
    backgroundColor: "#ffffff",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
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
