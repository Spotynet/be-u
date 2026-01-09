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
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState} from "react";
import * as ImagePicker from "expo-image-picker";
import {postApi, tokenUtils, errorUtils} from "@/lib/api";

export default function CreateBeforeAfterScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState("");

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
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Antes/Después</Text>
        <TouchableOpacity onPress={handlePublish} style={styles.publishButton}>
          <Text style={[styles.publishButtonText, {color: colors.primary}]}>Publicar</Text>
        </TouchableOpacity>
      </View>

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
          <View style={[styles.section, {backgroundColor: colors.card}]}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Vista Previa</Text>
            <View style={styles.comparisonContainer}>
              <Image source={{uri: beforePhoto}} style={styles.comparisonImage} />
              <View style={styles.divider} />
              <Image source={{uri: afterPhoto}} style={styles.comparisonImage} />
            </View>
          </View>
        )}

        {/* Description */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Descripción del Proceso
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Describe el proceso de transformación..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* Publish Button */}
        <TouchableOpacity
          style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
          onPress={handlePublish}
          activeOpacity={0.8}>
          <Ionicons name="swap-horizontal" color="#ffffff" size={24} />
          <Text style={styles.publishButtonLargeText}>Publicar Transformación</Text>
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
