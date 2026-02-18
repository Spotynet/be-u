import {View, TouchableOpacity, StyleSheet, ActivityIndicator} from "react-native";
import {useState, useEffect} from "react";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {AppHeader, APP_HEADER_ICON_SIZE, APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";
import {PublicProfileContent} from "@/components/profile/PublicProfileContent";
import {profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth";

export function ProfessionalProfileTab() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user} = useAuth();
  const [publicProfileId, setPublicProfileId] = useState<number | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(true);
  const displayName =
    [
      (user as any)?.firstName || (user as any)?.first_name,
      (user as any)?.lastName || (user as any)?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || "Perfil";

  useEffect(() => {
    const fetchPublicProfileId = async () => {
      try {
        setIsLoadingId(true);
        const response = await profileCustomizationApi.getProfileImages();
        if (response.data?.id) {
          setPublicProfileId(response.data.id);
        }
      } catch (err) {
        console.log("Error fetching public profile:", err);
      } finally {
        setIsLoadingId(false);
      }
    };
    fetchPublicProfileId();
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title={displayName}
        showBackButton={false}
        backgroundColor={colors.background}
        borderBottom={colors.border}
        rightExtra={
          <TouchableOpacity
            onPress={() => router.push("/profile/config")}
            activeOpacity={0.7}
            style={[styles.headerIconButton, {backgroundColor: colors.card}]}>
            <Ionicons name="settings" color={colors.primary} size={APP_HEADER_ICON_SIZE} />
          </TouchableOpacity>
        }
      />
      {isLoadingId ? (
        <View style={[styles.loadingWrap, {backgroundColor: colors.background}]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : publicProfileId ? (
        <PublicProfileContent profileId={publicProfileId} />
      ) : (
        <View style={[styles.emptyWrap, {backgroundColor: colors.background}]}>
          <Ionicons name="person-outline" size={60} color={colors.mutedForeground} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerIconButton: {
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
    borderRadius: APP_HEADER_BUTTON_HIT / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
