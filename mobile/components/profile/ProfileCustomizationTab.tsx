import React, {useState, useEffect} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {ImageGallery} from "./ImageGallery";
import AvailabilityScreen from "@/app/availability";
import ServiceManagementScreen from "@/app/profile/services";
import {profileCustomizationApi} from "@/lib/api";
import {TourTarget} from "@/components/onboarding/TourTarget";
import {useProviderTour} from "@/features/onboarding/ProviderTourProvider";

type CustomizationTab = "images" | "services" | "calendar" | "team";

interface ProfileCustomizationTabProps {
  userRole?: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export const ProfileCustomizationTab = ({userRole = "PROFESSIONAL"}: ProfileCustomizationTabProps) => {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {currentStep, isActive} = useProviderTour();
  const [activeTab, setActiveTab] = useState<CustomizationTab>("images");
  const [publicProfileId, setPublicProfileId] = useState<number | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const isPlace = userRole === "PLACE";

  // Auto-switch tabs based on tour step
  useEffect(() => {
    if (isActive && currentStep) {
      if (currentStep === "mipagina_viewPublicProfile") {
        // Keep current tab, just highlight the button
      } else if (currentStep === "mipagina_images") {
        setActiveTab("images");
      } else if (currentStep === "mipagina_services") {
        setActiveTab("services");
      } else if (currentStep === "mipagina_calendar") {
        setActiveTab("calendar");
      } else if (currentStep === "mipagina_team") {
        setActiveTab("team");
      }
    }
  }, [isActive, currentStep]);

  // Fetch the user's public profile ID
  useEffect(() => {
    const fetchPublicProfileId = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await profileCustomizationApi.getProfileImages();
        if (response.data?.id) {
          setPublicProfileId(response.data.id);
        }
      } catch (error) {
        console.log("Error fetching public profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchPublicProfileId();
  }, []);

  const handleViewPublicProfile = () => {
    if (publicProfileId) {
      router.push(`/profile/${publicProfileId}` as any);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "images":
        return <ImageGallery maxImages={10} />;
      case "services":
        return <ServiceManagementScreen embedded />;
      case "calendar":
        return <AvailabilityScreen embedded />;
      case "team":
        return (
          <View style={[styles.teamSection, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Text style={[styles.teamTitle, {color: colors.foreground}]}>Equipo de Profesionales</Text>
            <Text style={[styles.teamDescription, {color: colors.mutedForeground}]}>
              Invita profesionales a formar parte de tu lugar y configura sus horarios de atención.
            </Text>
            <TouchableOpacity
              style={[styles.teamButton, {backgroundColor: colors.primary}]}
              onPress={() => router.push("/place/manage-links")}
              activeOpacity={0.8}>
              <Ionicons name="people" color="#ffffff" size={20} />
              <Text style={styles.teamButtonText}>Gestionar Equipo</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Sub-tab Navigation + View public profile (compact) */}
      <TourTarget targetId="mipagina_tab">
        <View
          style={[
            styles.subTabRow,
            {backgroundColor: colors.card, borderBottomColor: colors.border},
          ]}>
        <View style={styles.subTabContainer}>
          <TourTarget targetId="mipagina_images">
            <TouchableOpacity
              style={[
                styles.subTabButton,
                activeTab === "images" && {borderBottomColor: colors.primary},
              ]}
              onPress={() => setActiveTab("images")}
              activeOpacity={0.7}
              accessibilityLabel="Imágenes">
              <Ionicons
                name={activeTab === "images" ? "images" : "images-outline"}
                size={22}
                color={activeTab === "images" ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </TourTarget>

          <TourTarget targetId="mipagina_services">
            <TouchableOpacity
              style={[
                styles.subTabButton,
                activeTab === "services" && {borderBottomColor: colors.primary},
              ]}
              onPress={() => setActiveTab("services")}
              activeOpacity={0.7}
              accessibilityLabel="Servicios">
              <Ionicons
                name={activeTab === "services" ? "briefcase" : "briefcase-outline"}
                size={22}
                color={activeTab === "services" ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </TourTarget>

          <TourTarget targetId="mipagina_calendar">
            <TouchableOpacity
              style={[
                styles.subTabButton,
                activeTab === "calendar" && {borderBottomColor: colors.primary},
              ]}
              onPress={() => setActiveTab("calendar")}
              activeOpacity={0.7}
              accessibilityLabel="Disponibilidad">
              <Ionicons
                name={activeTab === "calendar" ? "calendar" : "calendar-outline"}
                size={22}
                color={activeTab === "calendar" ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </TourTarget>

          {isPlace && (
            <TourTarget targetId="mipagina_team">
              <TouchableOpacity
                style={[
                  styles.subTabButton,
                  activeTab === "team" && {borderBottomColor: colors.primary},
                ]}
                onPress={() => setActiveTab("team")}
                activeOpacity={0.7}
                accessibilityLabel="Equipo">
                <Ionicons
                  name={activeTab === "team" ? "people" : "people-outline"}
                  size={22}
                  color={activeTab === "team" ? colors.primary : colors.mutedForeground}
                />
              </TouchableOpacity>
            </TourTarget>
          )}
        </View>

        {/* Ver perfil: botón con ícono + texto */}
        {!isLoadingProfile && publicProfileId && (
          <TourTarget targetId="mipagina_viewPublicProfile">
            <TouchableOpacity
              style={[styles.viewProfileButton, {backgroundColor: colors.primary, borderColor: colors.primary}]}
              onPress={handleViewPublicProfile}
              activeOpacity={0.8}
              accessibilityLabel="Ver perfil público">
              <Ionicons name="eye-outline" color="#ffffff" size={18} />
              <Text style={styles.viewProfileButtonText}>Ver perfil</Text>
            </TouchableOpacity>
          </TourTarget>
        )}
        </View>
      </TourTarget>

      {isLoadingProfile && (
        <View style={[styles.subTabRow, {backgroundColor: colors.card, borderBottomColor: colors.border}]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        </View>
      )}

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  subTabRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  subTabContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-start",
  },
  subTabButton: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  content: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  },
  teamSection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  teamButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  teamButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewProfileButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});










































