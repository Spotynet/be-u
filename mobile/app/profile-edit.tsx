import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {useUserProfile, useProfileUpdate} from "@/features/users";
import {useRouter, Redirect} from "expo-router";
import {useRef} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ClientSettingsForm} from "@/components/settings";
import {AppHeader} from "@/components/ui/AppHeader";

export default function ProfileEdit() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  const {profile, isLoading: profileLoading} = useUserProfile();
  const {updateProfile, isLoading: updating} = useProfileUpdate(user?.id || 0, "CLIENT");
  const router = useRouter();
  const formRef = useRef<{save: () => Promise<void>} | null>(null);

  if (!user || user.role !== "CLIENT") {
    return <Redirect href="/(tabs)/perfil" />;
  }

  const handleSave = async (userData: any, profileData: any) => {
    try {
      await updateProfile(profileData, userData);
      router.back();
    } catch {
      // Error handled in hook
    }
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Información Personal"
          showBackButton
          backFallbackRoute="/(tabs)/perfil"
          onBackPress={() => router.back()}
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Información Personal"
        showBackButton
        backFallbackRoute="/(tabs)/perfil"
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView
          style={[styles.scroll, {backgroundColor: colors.contentBackground}]}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: 96 + Math.max(insets.bottom, 16)},
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ClientSettingsForm
            ref={formRef}
            user={user}
            profile={profile as any}
            onSave={handleSave}
            isLoading={updating}
          />
        </ScrollView>
        <View
          style={[
            styles.fixedBottom,
            {
              backgroundColor: colors.contentBackground,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {backgroundColor: updating ? colors.muted : colors.primary},
            ]}
            onPress={async () => {
              if (formRef.current?.save) await formRef.current.save();
            }}
            disabled={updating}
            activeOpacity={0.8}>
            {updating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : null}
            <Text style={styles.saveBtnText}>
              {updating ? "Guardando..." : "Guardar Cambios"}
            </Text>
            {!updating && (
              <Ionicons name="checkmark-circle" color="#ffffff" size={22} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  loading: {flex: 1, justifyContent: "center", alignItems: "center"},
  keyboardAvoid: {flex: 1},
  scroll: {flex: 1},
  scrollContent: {padding: 24},
  fixedBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {elevation: 5},
    }),
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});
