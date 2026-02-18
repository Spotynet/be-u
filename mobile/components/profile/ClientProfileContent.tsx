import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {useUserProfile} from "@/features/users";
import {useRouter} from "expo-router";
import {useState} from "react";
import {profileCustomizationApi, authApi, errorUtils} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import {Platform} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// Light-mode specific accents (peach/logout) - use primary tints in dark

export function ClientProfileContent() {
  const {colors, colorMode, setColorMode} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, logout, refreshToken} = useAuth();
  const {refreshProfile} = useUserProfile();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
        router.push("/profile-edit");
        break;
      case "favorites":
        router.push("/guardados");
        break;
      case "notifications":
        router.push("/(tabs)/notificaciones");
        break;
      case "privacy":
        break;
      case "help":
        router.push("/help-support");
        break;
      default:
        break;
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteModal(false);
      await authApi.deleteMyAccount();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      const message = errorUtils.getErrorMessage(error);
      Alert.alert("Error", message || "No se pudo eliminar la cuenta.");
    } finally {
      setIsDeleting(false);
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
  const versionTextColor = colors.mutedForeground;

  return (
    <ScrollView
      style={[styles.scroll, {backgroundColor: colors.contentBackground}]}
      contentContainerStyle={[
        styles.scrollContent,
        {paddingBottom: Math.max(insets.bottom + 80, 120)},
      ]}
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
          <Text style={[styles.optionText, {color: colors.foreground}]}>Guardados</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <View style={[styles.optionDivider, {backgroundColor: colors.border}]} />
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
          onPress={() => setShowDeleteModal(true)}
          activeOpacity={0.7}>
          <Ionicons name="trash-outline" color={logoutTextColor} size={22} style={{opacity: 0.7}} />
          <Text style={[styles.optionText, {color: logoutTextColor, opacity: 0.7}]}>Eliminar cuenta</Text>
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
      <Text style={[styles.versionText, {color: versionTextColor}]}>
        nabbi App v1.3.10
      </Text>

      {/* Delete modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}>
        <View style={styles.deleteOverlay}>
          <View style={[styles.deleteModal, {backgroundColor: colors.card}]}>
            <Text style={[styles.deleteTitle, {color: colors.foreground}]}>
              Eliminar cuenta
            </Text>
            <Text style={[styles.deleteWarning, {color: colors.foreground}]}>
              Esta acción no se puede deshacer. Se eliminarán todos tus datos permanentemente.
            </Text>
            <TouchableOpacity
              style={[styles.deleteCancelBtn, {backgroundColor: colors.primary}]}
              onPress={() => setShowDeleteModal(false)}
              disabled={isDeleting}>
              <Text style={[styles.deleteCancelText, {color: colors.primaryForeground}]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteConfirmBtn}
              onPress={handleConfirmDelete}
              disabled={isDeleting}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Text style={[styles.deleteConfirmText, {color: colors.destructive}]}>Eliminar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  deleteModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  deleteWarning: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  deleteCancelBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  deleteCancelText: {
    fontSize: 16,
    fontWeight: "700",
  },
  deleteConfirmBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteConfirmText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
