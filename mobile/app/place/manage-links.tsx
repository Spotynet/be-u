import React, {useEffect, useState} from "react";
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList, Alert, ScrollView} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {linkApi, PlaceProfessionalLink, errorUtils} from "@/lib/api";
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
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | null; message: string; details?: any}>({type: null, message: ''});

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
      setFeedbackMessage({
        type: 'error',
        message: "Ingresa IDs de lugar y profesional."
      });
      setTimeout(() => setFeedbackMessage({type: null, message: ''}), 5000);
      return;
    }
    try {
      setInviting(true);
      setFeedbackMessage({type: null, message: ''}); // Clear previous messages
      await linkApi.inviteProfessionalToPlace(Number(placeId), Number(professionalId));
      setFeedbackMessage({
        type: 'success',
        message: "¡Invitación enviada! El profesional recibirá la invitación."
      });
      setProfessionalId("");
      await loadLinks();
      // Clear success message after 3 seconds
      setTimeout(() => setFeedbackMessage({type: null, message: ''}), 3000);
    } catch (e: any) {
      // Extract error data from different possible locations
      const errorData = e?.response?.data || e?.data || {};
      
      // Priority: Use detail from backend response
      // Check multiple possible locations for the detail field
      let mainMessage = errorData?.detail || 
                       e?.response?.data?.detail || 
                       e?.data?.detail ||
                       e?.detail;
      
      // If no detail found, try errorUtils
      if (!mainMessage) {
        mainMessage = errorUtils.getErrorMessage(e);
      }
      
      // Filter out technical error messages
      if (!mainMessage || mainMessage.includes('status code') || mainMessage.includes('Request failed')) {
        mainMessage = "No se pudo enviar la invitación.";
      }
      
      setFeedbackMessage({
        type: 'error',
        message: mainMessage,
        details: errorData
      });
      // Clear error message after 8 seconds (longer for error messages)
      setTimeout(() => setFeedbackMessage({type: null, message: ''}), 8000);
    } finally {
      setInviting(false);
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
      <ScrollView contentContainerStyle={{padding: 16}}>
        <Text style={[styles.title, {color: colors.foreground}]}>Gestionar Profesionales del Lugar</Text>

        {/* Feedback Message */}
        {feedbackMessage.type && (
          <View
            style={[
              styles.feedbackBanner,
              {
                backgroundColor: feedbackMessage.type === 'success' 
                  ? '#10b98120' 
                  : '#ef444420',
                borderColor: feedbackMessage.type === 'success'
                  ? '#10b981'
                  : '#ef4444',
              },
            ]}>
            <Ionicons
              name={feedbackMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={feedbackMessage.type === 'success' ? '#10b981' : '#ef4444'}
            />
            <View style={styles.feedbackContent}>
              <Text
                style={[
                  styles.feedbackText,
                  {
                    color: feedbackMessage.type === 'success' ? '#10b981' : '#ef4444',
                  },
                ]}>
                {feedbackMessage.message}
              </Text>
              {feedbackMessage.details && (feedbackMessage.details.place_categories || feedbackMessage.details.professional_categories) && (
                <View style={styles.categoryDetails}>
                  <Text style={[styles.categoryLabel, {color: colors.mutedForeground}]}>
                    Categorías del establecimiento:
                  </Text>
                  <View style={styles.categoryTags}>
                    {(feedbackMessage.details.place_categories || []).length > 0 ? (
                      (feedbackMessage.details.place_categories || []).map((cat: string, idx: number) => (
                        <View key={idx} style={[styles.categoryTag, {backgroundColor: colors.primary + '20'}]}>
                          <Text style={[styles.categoryTagText, {color: colors.primary}]}>{cat}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.categoryEmpty, {color: colors.mutedForeground}]}>Ninguna</Text>
                    )}
                  </View>
                  <Text style={[styles.categoryLabel, {color: colors.mutedForeground, marginTop: 8}]}>
                    Categorías del profesional:
                  </Text>
                  <View style={styles.categoryTags}>
                    {(feedbackMessage.details.professional_categories || []).length > 0 ? (
                      (feedbackMessage.details.professional_categories || []).map((cat: string, idx: number) => (
                        <View key={idx} style={[styles.categoryTag, {backgroundColor: colors.primary + '20'}]}>
                          <Text style={[styles.categoryTagText, {color: colors.primary}]}>{cat}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.categoryEmpty, {color: colors.mutedForeground}]}>Ninguna</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setFeedbackMessage({type: null, message: ''})}
              style={styles.feedbackCloseBtn}>
              <Ionicons
                name="close"
                size={18}
                color={feedbackMessage.type === 'success' ? '#10b981' : '#ef4444'}
              />
            </TouchableOpacity>
          </View>
        )}

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
      </ScrollView>
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
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  feedbackCloseBtn: {
    padding: 4,
  },
  categoryDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryEmpty: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});


