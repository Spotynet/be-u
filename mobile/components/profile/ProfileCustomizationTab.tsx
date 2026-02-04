import React, {useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useRouter} from "expo-router";
import {ImageGallery} from "./ImageGallery";
import AvailabilityScreen from "@/app/availability";
import ServiceManagementScreen from "@/app/profile/services";

type CustomizationTab = "images" | "services" | "calendar" | "team";

interface ProfileCustomizationTabProps {
  userRole?: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export const ProfileCustomizationTab = ({userRole = "PROFESSIONAL"}: ProfileCustomizationTabProps) => {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CustomizationTab>("images");
  const isPlace = userRole === "PLACE";

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
      {/* Sub-tab Navigation */}
      <View
        style={[
          styles.subTabContainer,
          {backgroundColor: colors.card, borderBottomColor: colors.border},
        ]}>
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
            size={24}
            color={activeTab === "images" ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>

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
            size={24}
            color={activeTab === "services" ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>

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
            size={24}
            color={activeTab === "calendar" ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>

        {isPlace && (
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
              size={24}
              color={activeTab === "team" ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{padding: 16, paddingBottom: 100}}
        showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subTabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
  },
  subTabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  content: {
    flex: 1,
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
});










































