import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import {useAuth} from "@/features/auth";
import {useUserProfile, useProfileUpdate} from "@/features/users";
import {useRouter, Redirect} from "expo-router";
import {useRef, useEffect, useState, useCallback} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {ClientSettingsForm, ClientSettingsFormHandle} from "@/components/settings";
import {AppHeader} from "@/components/ui/AppHeader";

import {useAppTheme} from "@/constants/theme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function ProfileEdit() {
  const theme = useAppTheme();
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user} = useAuth();
  const {profile, isLoading: profileLoading} = useUserProfile();
  const {updateProfile, isLoading: updating} = useProfileUpdate(user?.id || 0, "CLIENT");
  const router = useRouter();
  const formRef = useRef<ClientSettingsFormHandle | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Attempt to navigate back; show modal if there are unsaved changes.
  const tryGoBack = useCallback(() => {
    if (formRef.current?.isDirty()) {
      setShowUnsavedModal(true);
    } else {
      router.back();
    }
  }, [router]);

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      tryGoBack();
      return true; // prevent default back
    });
    return () => sub.remove();
  }, [tryGoBack]);

  const handleDiscard = () => {
    setShowUnsavedModal(false);
    router.back();
  };

  const handleSaveFromModal = async () => {
    setShowUnsavedModal(false);
    if (formRef.current?.save) await formRef.current.save();
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    keyboardAvoid: { flex: 1 },
    scroll: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { padding: 24 },
    fixedBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      backgroundColor: colors.bg,
      borderTopColor: colors.border,
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
      fontSize: 18,
      fontWeight: "700",
    },

    // Unsaved changes modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 12,
      ...Platform.select({
        ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.15, shadowRadius: 12},
        android: {elevation: 20},
      }),
    },
    modalHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 8,
    },
    modalBody: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 28,
    },
    modalSaveBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      marginBottom: 12,
    },
    modalSaveBtnText: {
      fontSize: 16,
      fontWeight: "700",
    },
    modalDiscardBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 8,
    },
    modalDiscardBtnText: {
      fontSize: 16,
      fontWeight: "600",
    },
    modalCancelBtn: {
      alignItems: "center",
      paddingVertical: 14,
    },
    modalCancelBtnText: {
      fontSize: 15,
      fontWeight: "500",
    },
  });

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
          onBackPress={tryGoBack}
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
        onBackPress={tryGoBack}
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
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : null}
            <Text style={[styles.saveBtnText, {color: colors.primaryForeground}]}>
              {updating ? "Guardando..." : "Guardar Cambios"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Unsaved changes confirmation modal */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowUnsavedModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUnsavedModal(false)}>
          <Pressable onPress={() => {}} style={[styles.modalSheet, {backgroundColor: colors.surface}]}>
            <View style={[styles.modalHandle, {backgroundColor: colors.border}]} />

            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Cambios sin guardar
            </Text>
            <Text style={[styles.modalBody, {color: colors.mutedForeground}]}>
              Tienes cambios en tu información personal que no han sido guardados. ¿Qué deseas hacer?
            </Text>

            {/* Save */}
            <TouchableOpacity
              style={[styles.modalSaveBtn, {backgroundColor: colors.primary}]}
              onPress={handleSaveFromModal}
              activeOpacity={0.85}>
              <Text style={[styles.modalSaveBtnText, {color: colors.primaryForeground}]}>
                Guardar cambios
              </Text>
            </TouchableOpacity>

            {/* Discard */}
            <TouchableOpacity
              style={[styles.modalDiscardBtn, {borderColor: colors.error}]}
              onPress={handleDiscard}
              activeOpacity={0.85}>
              <Text style={[styles.modalDiscardBtnText, {color: colors.error}]}>
                Descartar cambios
              </Text>
            </TouchableOpacity>

            {/* Cancel (stay on page) */}
            <TouchableOpacity
              style={[styles.modalCancelBtn, {paddingBottom: Math.max(insets.bottom, 16)}]}
              onPress={() => setShowUnsavedModal(false)}
              activeOpacity={0.7}>
              <Text style={[styles.modalCancelBtnText, {color: colors.mutedForeground}]}>
                Seguir editando
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
