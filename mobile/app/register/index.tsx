import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, Pressable} from "react-native";
import {useRouter, useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function RegisterSelector() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    googleEmail?: string;
    googleFirstName?: string;
    googleLastName?: string;
    googlePicture?: string;
    googleId?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
  }>();
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();

  const googleParams = params.googleEmail
    ? {
        googleEmail: params.googleEmail,
        googleFirstName: params.googleFirstName || "",
        googleLastName: params.googleLastName || "",
        googlePicture: params.googlePicture || "",
        googleId: params.googleId || "",
        googleAccessToken: params.googleAccessToken || "",
        googleRefreshToken: params.googleRefreshToken || "",
      }
    : {};

  const registerOptions = [
    {
      id: "client",
      title: "Cliente",
      description: "Reservar citas y descubrir profesionales",
      route: "/register/client" as const,
      icon: "person-outline" as const,
    },
    {
      id: "professional",
      title: "Profesional",
      description: "Ofrecer tus servicios de forma independiente",
      route: "/register/pro" as const,
      icon: "briefcase-outline" as const,
    },
    {
      id: "place",
      title: "Lugar",
      description: "Salón, negocio o espacio con equipo",
      route: "/register/place" as const,
      icon: "business-outline" as const,
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 12),
          },
        ]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Crear cuenta</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={[styles.hero, {paddingTop: 32}]}>
        <View style={[styles.logoCircle, {backgroundColor: colors.primary}]}>
          <Ionicons name="sparkles" color={colors.primaryForeground} size={28} />
        </View>
        <Text style={[styles.heroTitle, {color: colors.foreground}]}>¿Cómo quieres usar Be-U?</Text>
        <Text style={[styles.heroSubtitle, {color: colors.mutedForeground}]}>
          Elige el tipo de cuenta que mejor te describa
        </Text>
      </View>

      <View style={[styles.cards, {paddingBottom: insets.bottom + 24}]}>
        {registerOptions.map((option) => (
          <Pressable
            key={option.id}
            style={({pressed}) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
            onPress={() => router.push({pathname: option.route, params: googleParams})}>
            <View style={[styles.cardIconWrap, {backgroundColor: colors.muted}]}>
              <Ionicons name={option.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, {color: colors.foreground}]}>{option.title}</Text>
              <Text style={[styles.cardText, {color: colors.mutedForeground}]}>
                {option.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {width: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center"},
  headerTitle: {fontSize: 17, fontWeight: "600", flex: 1, textAlign: "center"},
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {fontSize: 20, fontWeight: "700", marginBottom: 6, textAlign: "center"},
  heroSubtitle: {fontSize: 15, lineHeight: 22, textAlign: "center"},
  cards: {paddingHorizontal: 20, gap: 14},
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {flex: 1, minWidth: 0},
  cardTitle: {fontSize: 16, fontWeight: "600", marginBottom: 2},
  cardText: {fontSize: 13, lineHeight: 18},
});
