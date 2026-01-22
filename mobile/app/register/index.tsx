import React from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function RegisterSelector() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();

  const registerOptions = [
    {
      id: "client",
      title: "Cliente",
      description: "Reservar y descubrir",
      route: "/register/client" as const,
    },
    {
      id: "professional",
      title: "Profesional",
      description: "Ofrecer servicios",
      route: "/register/pro" as const,
    },
    {
      id: "place",
      title: "Lugar",
      description: "Salón / Negocio",
      route: "/register/place" as const,
    },
  ];

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top + 24}]}>
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Crear cuenta</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.googleButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => {}}
          activeOpacity={0.8}>
          <Ionicons name="logo-google" size={20} color={colors.foreground} />
          <Text style={[styles.googleButtonText, {color: colors.foreground}]}>
            Continuar con Google
          </Text>
        </TouchableOpacity>
        {registerOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={() => router.push(option.route)}
            activeOpacity={0.9}>
            <Text style={[styles.cardTitle, {color: colors.foreground}]}>{option.title}</Text>
            <Text style={[styles.cardText, {color: colors.mutedForeground}]}>{option.description}</Text>
          </TouchableOpacity>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {width: 32, height: 32, alignItems: "center", justifyContent: "center"},
  headerTitle: {fontSize: 20, fontWeight: "700"},
  cards: {padding: 16, gap: 12},
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleButtonText: {fontSize: 14, fontWeight: "600"},
  card: {borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center", gap: 8},
  cardTitle: {fontSize: 16, fontWeight: "700"},
  cardText: {fontSize: 13},
});
