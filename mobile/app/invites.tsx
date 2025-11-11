import React, {useEffect, useState} from "react";
import {View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, Alert} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {linkApi, PlaceProfessionalLink} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {useRouter} from "expo-router";

export default function InvitesScreen() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<PlaceProfessionalLink[]>([]);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const resp = await linkApi.listMyLinks({status: "INVITED"});
      const data = Array.isArray(resp.data) ? resp.data : [];
      setInvites(data);
    } catch (e) {
      console.error("Failed to load invites", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, []);

  const onAccept = async (id: number) => {
    try {
      await linkApi.acceptInvite(id);
      await loadInvites();
      Alert.alert("Invitación aceptada", "Ahora puedes gestionar horarios con el lugar.");
    } catch (e) {
      Alert.alert("Error", "No se pudo aceptar la invitación.");
    }
  };
  const onReject = async (id: number) => {
    try {
      await linkApi.rejectInvite(id);
      await loadInvites();
    } catch (e) {
      Alert.alert("Error", "No se pudo rechazar la invitación.");
    }
  };

  if (!isAuthenticated || user?.role !== "PROFESSIONAL") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Text style={[styles.text, {color: colors.foreground}]}>Inicia sesión como profesional para ver invitaciones.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.title, {color: colors.foreground}]}>Invitaciones de lugares</Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : invites.length === 0 ? (
        <Text style={[styles.text, {color: colors.mutedForeground}]}>No tienes invitaciones pendientes.</Text>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => String(item.id)}
          renderItem={({item}) => (
            <View style={[styles.card, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <Text style={[styles.cardTitle, {color: colors.foreground}]}>{item.place_name}</Text>
              <Text style={[styles.cardSub, {color: colors.mutedForeground}]}>Invitado por {item.invited_by_email || "—"}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={() => onAccept(item.id)}>
                  <Text style={styles.buttonText}>Aceptar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, {backgroundColor: "#ef4444"}]} onPress={() => onReject(item.id)}>
                  <Text style={styles.buttonText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  title: {fontSize: 20, fontWeight: "700", marginBottom: 12},
  text: {fontSize: 14},
  card: {borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12},
  cardTitle: {fontSize: 16, fontWeight: "700"},
  cardSub: {fontSize: 12, marginTop: 4},
  row: {flexDirection: "row", gap: 8, marginTop: 12},
  button: {paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10},
  buttonText: {color: "#fff", fontWeight: "700"},
});


