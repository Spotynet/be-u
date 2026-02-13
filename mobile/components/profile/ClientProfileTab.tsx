import {View, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {ClientProfileContent} from "@/components/profile/ClientProfileContent";

export function ClientProfileTab() {
  const {colors} = useThemeVariant();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Perfil"
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
