import {View, StyleSheet} from "react-native";
import {useRouter} from "expo-router";
import {AppHeader} from "@/components/ui/AppHeader";
import {ProfessionalSettingsContent} from "@/components/profile/ProfessionalSettingsContent";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {Redirect} from "expo-router";

export default function ProfileConfigScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user} = useAuth();

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
  if (!user || !isProvider) {
    return <Redirect href="/(tabs)/perfil" />;
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Configuración"
        showBackButton
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <View style={[styles.content, {backgroundColor: colors.contentBackground}]}>
        <ProfessionalSettingsContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
});
