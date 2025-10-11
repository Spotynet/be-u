import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {useState} from "react";
import {MediaUploader} from "@/components/posts/MediaUploader";

export default function CreatePhotoPostScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handlePublish = () => {
    if (photos.length === 0) {
      Alert.alert("Error", "Agrega al menos una foto");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Agrega una descripción");
      return;
    }

    // Simulate publish
    Alert.alert("¡Publicado!", "Tu foto ha sido publicada exitosamente", [
      {
        text: "Ver Publicación",
        onPress: () => router.push("/(tabs)/"),
      },
    ]);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Foto + Descripción</Text>
        <TouchableOpacity onPress={handlePublish} style={styles.publishButton}>
          <Text style={[styles.publishButtonText, {color: colors.primary}]}>Publicar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Media Uploader */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Fotos</Text>
          <MediaUploader
            mediaType="photo"
            maxFiles={10}
            onMediaSelected={setPhotos}
            selectedMedia={photos}
          />
        </View>

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
          />
        </View>

        {/* Location (Optional) */}
        <View style={[styles.section, {backgroundColor: colors.card}]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Ubicación</Text>
            <Text style={[styles.optionalBadge, {color: colors.mutedForeground}]}>Opcional</Text>
          </View>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.inputBackground, borderColor: colors.border},
            ]}>
            <Ionicons name="location-outline" color={colors.mutedForeground} size={20} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              placeholder="Agrega una ubicación"
              placeholderTextColor={colors.mutedForeground}
              value={location}
              onChangeText={setLocation}
            />
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
          style={[styles.publishButtonLarge, {backgroundColor: colors.primary}]}
          onPress={handlePublish}
          activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" color="#ffffff" size={24} />
          <Text style={styles.publishButtonLargeText}>Publicar Ahora</Text>
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
