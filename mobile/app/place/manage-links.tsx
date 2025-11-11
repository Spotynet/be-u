import React, {useEffect, useState} from "react";
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, Alert} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {linkApi, PlaceProfessionalLink} from "@/lib/api";
import {useRouter} from "expo-router";

export default function ManageLinksScreen() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();
  const router = useRouter();
  const [placeId, setPlaceId] = useState<string>("");
  const [links, setLinks] = useState<PlaceProfessionalLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [professionalId, setProfessionalId] = useState<string>("");

  const loadLinks = async () => {
    if (!placeId) return;
    try {
      setLoading(true);
      const resp = await linkApi.listPlaceLinks(Number(placeId), "ACCEPTED");
      setLinks(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error("Failed to load links", e);
    } finally {
      setLoading(false);
    }
  };

  const invite = async () => {
    if (!placeId || !professionalId) {
      Alert.alert("Datos incompletos", "Ingresa IDs de lugar y profesional.");
      return;
    }
    try {
      setInviting(true);
      await linkApi.inviteProfessionalToPlace(Number(placeId), Number(professionalId));
      Alert.alert("Invitación enviada", "El profesional recibirá la invitación.");
    } catch (e) {
      Alert.alert("Error", "No se pudo enviar la invitación.");
    } finally {
      setInviting(false);
      setProfessionalId("");
      await loadLinks();
    }
  };

  useEffect(() => {
    loadLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  if (!isAuthenticated || user?.role !== "PLACE") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Text style={[styles.text, {color: colors.foreground}]}>Inicia sesión como lugar para gestionar profesionales.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Text style={[styles.title, {color: colors.foreground}]}>Gestionar Profesionales del Lugar</Text>

      <Text style={[styles.label, {color: colors.mutedForeground}]}>ID de Lugar</Text>
      <TextInput
        value={placeId}
        onChangeText={setPlaceId}
        placeholder="Ingresa tu place_id"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="number-pad"
        style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
      />

      <View style={{height: 12}} />

      <Text style={[styles.label, {color: colors.mutedForeground}]}>Invitar Profesional (ID)</Text>
      <View style={styles.row}>
        <TextInput
          value={professionalId}
          onChangeText={setProfessionalId}
          placeholder="professional_id"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          style={[styles.input, {flex: 1, borderColor: colors.border, color: colors.foreground}]}
        />
        <TouchableOpacity style={[styles.button, {backgroundColor: colors.primary}]} onPress={invite} disabled={inviting}>
          {inviting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Invitar</Text>}
        </TouchableOpacity>
      </View>

      <View style={{height: 16}} />
      <Text style={[styles.subtitle, {color: colors.foreground}]}>Profesionales Vinculados</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={links}
          keyExtractor={(item) => String(item.id)}
          renderItem={({item}) => (
            <View style={[styles.card, {borderColor: colors.border, backgroundColor: colors.card}]}>
              <Text style={[styles.cardTitle, {color: colors.foreground}]}>{item.professional_name}</Text>
              <Text style={{color: colors.mutedForeground}}>Estado: {item.status}</Text>
              <View style={{height: 8}} />
              <TouchableOpacity
                style={[styles.button, {backgroundColor: colors.primary, alignSelf: "flex-start"}]}
                onPress={() => router.push(`/place/link-schedule?linkId=${item.id}`)}>
                <Text style={styles.buttonText}>Configurar Horario</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={{color: colors.mutedForeground}}>No hay profesionales vinculados.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  title: {fontSize: 20, fontWeight: "700", marginBottom: 12},
  subtitle: {fontSize: 16, fontWeight: "700", marginBottom: 8},
  label: {fontSize: 12, marginBottom: 6},
  text: {fontSize: 14},
  row: {flexDirection: "row", alignItems: "center", gap: 8},
  input: {borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12},
  button: {paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10},
  buttonText: {color: "#fff", fontWeight: "700"},
  card: {borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12},
  cardTitle: {fontSize: 16, fontWeight: "700", marginBottom: 4},
});


