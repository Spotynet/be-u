import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, Image} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function RegisterSelector() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();

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
          style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => router.push("/register/client")}
          activeOpacity={0.9}>
          <Image source={require("@/assets/images/pink.png")} style={styles.cardIcon} />
          <Text style={[styles.cardTitle, {color: colors.foreground}]}>Cliente</Text>
          <Text style={[styles.cardText, {color: colors.mutedForeground}]}>
            Reservar y descubrir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => router.push("/register/pro")}
          activeOpacity={0.9}>
          <Image source={require("@/assets/images/purple.png")} style={styles.cardIcon} />
          <Text style={[styles.cardTitle, {color: colors.foreground}]}>Profesional</Text>
          <Text style={[styles.cardText, {color: colors.mutedForeground}]}>Ofrecer servicios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}
          onPress={() => router.push("/register/place")}
          activeOpacity={0.9}>
          <Image source={require("@/assets/images/orange.png")} style={styles.cardIcon} />
          <Text style={[styles.cardTitle, {color: colors.foreground}]}>Lugar</Text>
          <Text style={[styles.cardText, {color: colors.mutedForeground}]}>Salón / Negocio</Text>
        </TouchableOpacity>
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
  card: {borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center"},
  cardIcon: {width: 40, height: 40, marginBottom: 8, resizeMode: "contain"},
  cardTitle: {fontSize: 16, fontWeight: "700", marginBottom: 4},
  cardText: {fontSize: 13},
});
