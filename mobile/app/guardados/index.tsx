import {View, StyleSheet} from "react-native";
import {useRouter} from "expo-router";
import {AppHeader} from "@/components/ui/AppHeader";
import {FavoritesTab} from "@/components/profile/FavoritesTab";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function GuardadosScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();

  return (
    <View style={[styles.container, {backgroundColor: colors.contentBackground}]}>
      <AppHeader
        title="Guardados"
        showBackButton
        onBackPress={() => router.back()}
        backgroundColor={colors.background}
        borderBottom={colors.border}
      />
      <View style={styles.content}>
        <FavoritesTab />
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
