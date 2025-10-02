import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: colors.foreground}]}>👤 Perfil</Text>
        <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
          Tu información personal
        </Text>
        <Text style={[styles.description, {color: colors.foreground}]}>
          Gestiona tu perfil, configuraciones y preferencias de la aplicación.
        </Text>

        {/* Auth Buttons */}
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={[styles.authButton, {backgroundColor: colors.primary}]}
            onPress={() => router.push("/login")}>
            <Ionicons name="log-in" color="#ffffff" size={20} />
            <Text style={[styles.authButtonText, {color: "#ffffff"}]}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.authButton,
              styles.registerButton,
              {backgroundColor: "transparent", borderColor: colors.primary},
            ]}
            onPress={() => router.push("/register")}>
            <Ionicons name="person-add" color={colors.primary} size={20} />
            <Text style={[styles.authButtonText, {color: colors.primary}]}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info Placeholder */}
        <View
          style={[styles.profileCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, {backgroundColor: colors.muted}]}>
              <Ionicons name="person" color={colors.mutedForeground} size={32} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, {color: colors.foreground}]}>Usuario Invitado</Text>
              <Text style={[styles.profileEmail, {color: colors.mutedForeground}]}>
                No has iniciado sesión
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Placeholder */}
        <View
          style={[styles.settingsCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Text style={[styles.settingsTitle, {color: colors.foreground}]}>Configuración</Text>
          <View style={styles.settingItem}>
            <Ionicons name="notifications" color={colors.mutedForeground} size={20} />
            <Text style={[styles.settingText, {color: colors.foreground}]}>Notificaciones</Text>
            <Ionicons name="chevron-forward" color={colors.mutedForeground} size={16} />
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="language" color={colors.mutedForeground} size={20} />
            <Text style={[styles.settingText, {color: colors.foreground}]}>Idioma</Text>
            <Ionicons name="chevron-forward" color={colors.mutedForeground} size={16} />
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="help-circle" color={colors.mutedForeground} size={20} />
            <Text style={[styles.settingText, {color: colors.foreground}]}>Ayuda</Text>
            <Ionicons name="chevron-forward" color={colors.mutedForeground} size={16} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  authContainer: {
    gap: 12,
    marginBottom: 32,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  registerButton: {
    borderWidth: 2,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  settingsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
});
