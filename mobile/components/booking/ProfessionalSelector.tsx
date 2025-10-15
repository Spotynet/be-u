import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Image} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {ProfessionalProfile} from "@/types/global";
import {useRouter} from "expo-router";

interface ProfessionalSelectorProps {
  professionals: ProfessionalProfile[];
  selectedProfessional: ProfessionalProfile | null;
  onSelectProfessional: (professional: ProfessionalProfile) => void;
}

export function ProfessionalSelector({
  professionals,
  selectedProfessional,
  onSelectProfessional,
}: ProfessionalSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, {color: colors.foreground}]}>Selecciona un Profesional</Text>
      <Text style={[styles.subtitle, {color: colors.mutedForeground}]}>
        Elige quién te atenderá en este servicio
      </Text>

      <View style={styles.professionalsList}>
        {professionals.map((professional) => {
          const isSelected = selectedProfessional?.id === professional.id;
          const fullName = `${professional.name} ${professional.last_name || ""}`.trim();

          return (
            <TouchableOpacity
              key={professional.id}
              style={[
                styles.professionalItem,
                {
                  backgroundColor: isSelected ? `${colors.primary}20` : colors.card,
                  borderColor: isSelected ? colors.primary : "rgba(255, 255, 255, 0.1)",
                },
              ]}
              onPress={() => onSelectProfessional(professional)}
              activeOpacity={0.7}>
              <View style={styles.professionalInfo}>
                {/* Avatar */}
                <View
                  style={[
                    styles.avatar,
                    {
                      borderColor: isSelected ? colors.primary : "rgba(255, 255, 255, 0.2)",
                    },
                  ]}>
                  <Text style={styles.avatarText}>
                    {professional.name.charAt(0).toUpperCase()}
                    {professional.last_name?.charAt(0).toUpperCase() || ""}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                  <Text style={[styles.professionalName, {color: colors.foreground}]}>
                    {fullName}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFA500" />
                    <Text style={[styles.rating, {color: colors.mutedForeground}]}>
                      {professional.rating?.toFixed(1) || "N/A"}
                    </Text>
                    {professional.services_count && (
                      <Text style={[styles.servicesCount, {color: colors.mutedForeground}]}>
                        • {professional.services_count} servicio
                        {professional.services_count !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Selection indicator */}
                {isSelected && (
                  <View style={[styles.checkmark, {backgroundColor: colors.primary}]}>
                    <Ionicons name="checkmark" size={20} color="#ffffff" />
                  </View>
                )}
              </View>

              {/* View details link */}
              <TouchableOpacity
                style={styles.detailsLink}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/professional/${professional.id}`);
                }}>
                <Text style={[styles.detailsLinkText, {color: colors.primary}]}>Ver perfil</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  professionalsList: {
    gap: 12,
  },
  professionalItem: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  professionalInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(147, 112, 219, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#9370DB",
  },
  infoContainer: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
  },
  servicesCount: {
    fontSize: 14,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  detailsLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
