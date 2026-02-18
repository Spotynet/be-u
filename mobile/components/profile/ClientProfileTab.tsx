import {View, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {ClientProfileContent} from "@/components/profile/ClientProfileContent";
import {useAuth} from "@/features/auth";

export function ClientProfileTab() {
  const {colors} = useThemeVariant();
  const {user} = useAuth();
  const displayName =
    [
      (user as any)?.firstName || (user as any)?.first_name,
      (user as any)?.lastName || (user as any)?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Perfil";

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title={displayName}
        showBackButton={false}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <View style={[styles.tabContent, {backgroundColor: colors.contentBackground}]}>
        <ClientProfileContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    overflow: "hidden",
  },
});
