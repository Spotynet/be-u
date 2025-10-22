import React, {useState} from "react";
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
import {ImageGallery} from "./ImageGallery";
import {ServiceManager} from "./ServiceManager";
import {AvailabilityManager} from "./AvailabilityManager";

type CustomizationTab = "images" | "services" | "calendar";

export const ProfileCustomizationTab = () => {
  const {colors} = useThemeVariant();
  const [activeTab, setActiveTab] = useState<CustomizationTab>("images");

  const renderTabContent = () => {
    switch (activeTab) {
      case "images":
        return <ImageGallery maxImages={10} />;
      case "services":
        return <ServiceManager />;
      case "calendar":
        return <AvailabilityManager />;
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
          activeOpacity={0.7}>
          <Ionicons
            name={activeTab === "images" ? "images" : "images-outline"}
            size={20}
            color={activeTab === "images" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.subTabText,
              {color: activeTab === "images" ? colors.primary : colors.mutedForeground},
            ]}>
            Imágenes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabButton,
            activeTab === "services" && {borderBottomColor: colors.primary},
          ]}
          onPress={() => setActiveTab("services")}
          activeOpacity={0.7}>
          <Ionicons
            name={activeTab === "services" ? "briefcase" : "briefcase-outline"}
            size={20}
            color={activeTab === "services" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.subTabText,
              {color: activeTab === "services" ? colors.primary : colors.mutedForeground},
            ]}>
            Servicios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabButton,
            activeTab === "calendar" && {borderBottomColor: colors.primary},
          ]}
          onPress={() => setActiveTab("calendar")}
          activeOpacity={0.7}>
          <Ionicons
            name={activeTab === "calendar" ? "calendar" : "calendar-outline"}
            size={20}
            color={activeTab === "calendar" ? colors.primary : colors.mutedForeground}
          />
          <Text
            style={[
              styles.subTabText,
              {color: activeTab === "calendar" ? colors.primary : colors.mutedForeground},
            ]}>
            Disponibilidad
          </Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
});



