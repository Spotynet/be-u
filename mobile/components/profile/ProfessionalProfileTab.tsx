import {View, Text, TouchableOpacity, StyleSheet, ActivityIndicator} from "react-native";
import {useState, useEffect, useCallback, useRef} from "react";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {AppHeader, APP_HEADER_ICON_SIZE, APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";
import {PublicProfileContent, PublicProfileContentRef} from "@/components/profile/PublicProfileContent";
import {ProfessionalSettingsContent} from "@/components/profile/ProfessionalSettingsContent";
import {
  HeroImageOverlay,
  ImageGallerySection,
  EmptyStateCard,
  SectionActionLink,
} from "@/components/profile/OwnerProfileOverlay";
import {profileCustomizationApi} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

export function ProfessionalProfileTab() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user} = useAuth();
  const {isActive: tourActive} = useProviderTour();
  const profileRef = useRef<PublicProfileContentRef>(null);
  const [publicProfileId, setPublicProfileId] = useState<number | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(true);
  const [ownerMode, setOwnerMode] = useState(true);
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [profileVersion, setProfileVersion] = useState(0);

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

  const handleProfileLoad = useCallback((profile: any) => {
    setProfileImages(profile?.images || []);
  }, []);

  const handleImagesChanged = useCallback(() => {
    profileRef.current?.reload();
  }, []);

  const EmptyServices = (
    <EmptyStateCard
      icon="briefcase-outline"
      title="Agrega tu primer servicio"
      description="Crea servicios para que tus clientes puedan reservar contigo"
      ctaLabel="Crear servicio"
      ctaRoute="/services"
    />
  );

  const EmptyGroupSessions = (
    <EmptyStateCard
      icon="people-outline"
      title="Crea sesiones grupales"
      description="Ofrece experiencias colectivas y aumenta tus ingresos"
      ctaLabel="Crear sesión"
      ctaRoute="/group-sessions"
    />
  );

  const EmptyPosts = (
    <EmptyStateCard
      icon="images-outline"
      title="Comparte tu trabajo"
      description="Publica fotos y novedades para atraer más clientes"
      ctaLabel="Crear publicación"
      ctaRoute="/(tabs)"
    />
  );

  const renderSectionHeaderExtra = (sectionKey: string) => {
    if (!ownerMode) return null;
    switch (sectionKey) {
      case "services":
        return <SectionActionLink route="/services" label="Gestionar" />;
      case "group_sessions":
        return <SectionActionLink route="/group-sessions" label="Gestionar" />;
      case "details":
        return <SectionActionLink route="/profile/settings" label="Editar" />;
      case "hours":
        return <SectionActionLink route="/availability" label="Editar" />;
      case "team":
        return <SectionActionLink route="/place/manage-links" label="Gestionar" />;
      default:
        return null;
    }
  };

  const heroOverlay = ownerMode && publicProfileId ? (
    <HeroImageOverlay
      profileId={publicProfileId}
      images={profileImages}
      onPhotoUploaded={handleImagesChanged}
    />
  ) : undefined;

  const gallerySection = ownerMode && publicProfileId ? (
    <ImageGallerySection
      profileId={publicProfileId}
      images={profileImages}
      onImagesChanged={handleImagesChanged}
    />
  ) : undefined;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title={tourActive ? "Configuración" : displayName}
        showBackButton={false}
        backgroundColor={colors.background}
        borderBottom={colors.border}
        rightExtra={
          !tourActive ? (
            <View style={styles.headerActions}>
              {publicProfileId ? (
                <TouchableOpacity
                  onPress={() => setOwnerMode(!ownerMode)}
                  activeOpacity={0.7}
                  style={[
                    styles.headerIconButton,
                    {backgroundColor: ownerMode ? colors.primary + "15" : colors.card},
                  ]}>
                  <Ionicons
                    name={ownerMode ? "eye-outline" : "create-outline"}
                    color={ownerMode ? colors.primary : colors.mutedForeground}
                    size={APP_HEADER_ICON_SIZE}
                  />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => router.push("/profile/config")}
                activeOpacity={0.7}
                style={[styles.headerIconButton, {backgroundColor: colors.card}]}>
                <Ionicons name="settings" color={colors.primary} size={APP_HEADER_ICON_SIZE} />
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />
      {!tourActive && publicProfileId ? (
        <View style={[styles.ownerModeBanner, {backgroundColor: ownerMode ? colors.primary + "08" : colors.card, borderBottomColor: colors.border}]}>
          <Ionicons
            name={ownerMode ? "create-outline" : "eye-outline"}
            size={14}
            color={ownerMode ? colors.primary : colors.mutedForeground}
          />
          <Text style={[styles.ownerModeBannerText, {color: ownerMode ? colors.primary : colors.mutedForeground}]}>
            {ownerMode ? "Vista de propietario — edita tu perfil desde aquí" : "Vista de cliente — cómo ven tu perfil otros usuarios"}
          </Text>
        </View>
      ) : null}
      {isLoadingId ? (
        <View style={[styles.loadingWrap, {backgroundColor: colors.background}]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tourActive ? (
        <ProfessionalSettingsContent />
      ) : publicProfileId ? (
        <PublicProfileContent
          ref={profileRef}
          key={`profile-${publicProfileId}`}
          profileId={publicProfileId}
          ownerMode={ownerMode}
          emptyServiceOverride={ownerMode ? EmptyServices : undefined}
          emptyGroupSessionOverride={ownerMode ? EmptyGroupSessions : undefined}
          emptyPostsOverride={ownerMode ? EmptyPosts : undefined}
          heroOverlay={heroOverlay}
          gallerySection={gallerySection}
          sectionHeaderExtra={renderSectionHeaderExtra}
          onProfileLoad={handleProfileLoad}
        />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
    borderRadius: APP_HEADER_BUTTON_HIT / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ownerModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  ownerModeBannerText: {
    fontSize: 12,
    fontWeight: "600",
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
