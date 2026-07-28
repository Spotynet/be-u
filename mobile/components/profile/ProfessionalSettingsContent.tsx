import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {useUserProfile} from "@/features/users";
import {useRouter} from "expo-router";
import {useState} from "react";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import {Platform} from "react-native";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

export function ProfessionalSettingsContent() {
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const {user, logout, refreshToken} = useAuth();
  const {refreshProfile} = useUserProfile();
  const {startTour} = useProviderTour();
  const router = useRouter();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isPlace = user?.role === "PLACE";
  const displayName =
    [
      (user as any)?.firstName || (user as any)?.first_name,
      (user as any)?.lastName || (user as any)?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Usuario";
  const profilePhoto = (user as any)?.image || null;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      // Ignore
    }
  };

  const handleOptionPress = (option: string) => {
    switch (option) {
      case "info":
        router.push("/profile/settings");
        break;
      case "favorites":
        router.push("/guardados");
        break;
      case "notifications":
        router.push("/notification-preferences");
        break;
      case "privacy":
        router.push("/privacy-security");
        break;
      case "help":
        router.push("/help-support");
        break;
      case "images":
        router.push("/profile/images");
        break;
      case "services":
        // Go to native services management used by reservations / group sessions
        router.push("/services");
        break;
      case "schedule":
        router.push("/availability");
        break;
      case "team":
        router.push("/place/manage-links");
        break;
      case "group_sessions":
        router.push("/group-sessions" as any);
        break;
      case "onboarding":
        startTour();
        break;
      case "reviews":
        router.push("/mis-resenas");
        break;
      case "sales":
        router.push("/mis-ventas");
        break;
      case "calendar":
        router.push("/google-calendar");
        break;
      default:
        break;
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const formData = new FormData();
        if (Platform.OS === "web") {
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const mimeType = blob.type || "image/jpeg";
          const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
          formData.append("photo", new File([blob], `photo.${ext}`, {type: mimeType}));
        } else {
          const uriParts = result.assets[0].uri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          formData.append(
            "photo",
            {uri: result.assets[0].uri, type: `image/${fileType}`, name: `photo.${fileType}`} as any
          );
        }
        await profileCustomizationApi.uploadUserProfilePhoto(formData);
        if (refreshToken) await refreshToken();
        await refreshProfile();
        Alert.alert("Éxito", "Foto actualizada correctamente");
      } catch {
        Alert.alert("Error", "No se pudo subir la foto.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const isDark = colorMode === "dark";
  const photoWrapBg = isDark ? colors.muted : "#FEE7EE";
  const logoutBtnBg = isDark ? colors.muted : "#FEE7EE";
  const logoutTextColor = colors.destructive;
  const sectionLabelColor = colors.mutedForeground;

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: colors.contentBackground}]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Profile section */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={[styles.photoWrap, {backgroundColor: photoWrapBg}]}
          onPress={pickImage}
          disabled={uploadingPhoto}
          activeOpacity={0.8}>
          {uploadingPhoto ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : profilePhoto ? (
            <Image source={{uri: profilePhoto}} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" color={colors.mutedForeground} size={48} />
              <Text style={[styles.photoPlaceholderText, {color: colors.mutedForeground}]}>
                Agregar foto
              </Text>
            </View>
          )}
          <View style={[styles.editBadge, {backgroundColor: colors.muted}]}>
            <Ionicons name="pencil" color={colors.foreground} size={14} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.userName, {color: colors.foreground}]}>{displayName}</Text>
      </View>

      {/* MI PÁGINA - Imágenes, Servicios, Horarios */}
      <Text style={[styles.sectionLabel, {color: sectionLabelColor}]}>MI PÁGINA</Text>
      <View style={[styles.optionsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("images")}
          activeOpacity={0.7}>
          <Ionicons name="images-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Imágenes</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("services")}
          activeOpacity={0.7}>
          <Ionicons name="briefcase-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Servicios</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("schedule")}
          activeOpacity={0.7}>
          <Ionicons name="calendar-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Horarios</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("group_sessions")}
          activeOpacity={0.7}>
          <Ionicons name="people-circle-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Sesiones grupales</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("reviews")}
          activeOpacity={0.7}>
          <Ionicons name="star-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Mis Reseñas</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("sales")}
          activeOpacity={0.7}>
          <Ionicons name="cash-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Mis Ventas</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        {isPlace && (
          <>
            <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => handleOptionPress("team")}
              activeOpacity={0.7}>
              <Ionicons name="people-outline" color={colors.foreground} size={22} />
              <Text style={[styles.optionText, {color: colors.foreground}]}>Equipo</Text>
              <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* AJUSTES DE CUENTA */}
      <Text style={[styles.sectionLabel, {color: sectionLabelColor}]}>AJUSTES DE CUENTA</Text>
      <View style={[styles.optionsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("info")}
          activeOpacity={0.7}>
          <Ionicons name="person-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Mi Información</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("favorites")}
          activeOpacity={0.7}>
          <Ionicons name="heart-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Favoritos</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("calendar")}
          activeOpacity={0.7}>
          <Ionicons name="logo-google" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Google Calendar</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionPress("privacy")} activeOpacity={0.7}>
          <Ionicons name="lock-closed-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>
            Seguridad y Privacidad
          </Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* PREFERENCIAS */}
      <Text style={[styles.sectionLabel, {color: sectionLabelColor}]}>PREFERENCIAS</Text>
      <View style={[styles.optionsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("notifications")}
          activeOpacity={0.7}>
          <Ionicons name="notifications-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>
            Preferencias de Notificación
          </Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <View style={styles.optionRow}>
          <Ionicons
            name={colorMode === "light" ? "moon-outline" : "sunny-outline"}
            color={colors.foreground}
            size={22}
          />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Modo Oscuro</Text>
          <Switch
            value={colorMode === "dark"}
            onValueChange={(v) => setColorMode(v ? "dark" : "light")}
            trackColor={{false: colors.muted, true: colors.primary}}
            thumbColor={colors.primaryForeground}
          />
        </View>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("help")}
          activeOpacity={0.7}>
          <Ionicons name="help-circle-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Soporte Técnico</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => handleOptionPress("onboarding")}
          activeOpacity={0.7}>
          <Ionicons name="sparkles-outline" color={colors.foreground} size={22} />
          <Text style={[styles.optionText, {color: colors.foreground}]}>Ver onboarding de nuevo</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>

      {/* Cerrar Sesión */}
      <TouchableOpacity
        style={[styles.logoutBtn, {backgroundColor: logoutBtnBg}]}
        onPress={handleLogout}
        activeOpacity={0.8}>
        <Ionicons name="log-out-outline" color={logoutTextColor} size={22} />
        <Text style={[styles.logoutText, {color: logoutTextColor}]}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={[styles.versionText, {color: colors.mutedForeground}]}>
        nabbi App v1.3.10
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  scrollContent: {padding: 24, paddingBottom: 48},
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  photoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: 4,
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontWeight: "600",
  },
  editBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  optionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  optionDivider: {
    height: 1,
    marginLeft: 54,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  versionText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
