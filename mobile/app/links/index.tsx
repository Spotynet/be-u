import React, {useEffect, useMemo, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {authApi, linkApi, profileApi, userApi, errorUtils} from "@/lib/api";
import {Dropdown} from "@/components/ui/Dropdown";
import {useAuth} from "@/features/auth/hooks/useAuth";

type Professional = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
};

export default function LinksManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useThemeVariant();
  const {user} = useAuth();

  const [placeId, setPlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linksAccepted, setLinksAccepted] = useState<any[]>([]);
  const [linksInvited, setLinksInvited] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error' | null; message: string; details?: any}>({type: null, message: ''});

  const isPlace = user?.role === "PLACE";
  const headerTitle = isPlace ? "Equipo" : "Vinculaciones";

  useEffect(() => {
    const init = async () => {
      if (!user || !isPlace) {
        setLoading(false);
        return;
      }
      try {
        let pid: number | null = null;

        // Attempt to get profile id from /auth/profile/ response
        try {
          const profileResp = await authApi.getProfile();
          pid = profileResp.data?.profile?.id ?? null;
        } catch (authErr) {
          console.warn("No se pudo obtener profile desde /auth/profile/:", authErr);
        }

        // Fallback disabled (requires profile id); rely on auth profile only

        setPlaceId(pid);
        await fetchLinks(pid ?? undefined);
      } catch (e) {
        // If we cannot fetch the place profile, show a friendly error
        Alert.alert("Error", "No se pudo obtener el perfil del establecimiento.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.id]);

  const fetchLinks = async (pid?: number | null) => {
    try {
      setRefreshing(true);
      const normalize = (response: any) => {
        if (!response) return [];
        const payload = response.data ?? response;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.results)) return payload.results;
        return [];
      };
      if (pid) {
        const [accepted, invited] = await Promise.all([
          linkApi.listPlaceLinks(pid, "ACCEPTED"),
          linkApi.listPlaceLinks(pid, "INVITED"),
        ]);
        setLinksAccepted(normalize(accepted));
        setLinksInvited(normalize(invited));
      } else {
        const [accepted, invited] = await Promise.all([
          linkApi.listMyLinks({status: "ACCEPTED"}),
          linkApi.listMyLinks({status: "INVITED"}),
        ]);
        setLinksAccepted(normalize(accepted));
        setLinksInvited(normalize(invited));
      }
    } catch (e) {
      // Silent error; UI will show empty lists
    } finally {
      setRefreshing(false);
    }
  };

  const performSearch = async () => {
    if (!search.trim()) {
      setResults([]);
      setSelectedProfessionalId("");
      return;
    }
    setIsSearching(true);
    try {
      const resp = await profileApi.searchProfessionals({search});
      const data = (resp.data?.results ?? resp.data) as any[];
      const normalized = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        first_name: item.name || item.first_name || item.firstName,
        last_name: item.last_name || item.lastName,
        username: item.user?.username,
        email: item.user?.email,
      }));
      setResults(normalized);
      if (normalized.length > 0) {
        setSelectedProfessionalId(String(normalized[0].id));
      } else {
        setSelectedProfessionalId("");
      }
    } catch (e) {
      Alert.alert("Error", "No se pudieron buscar profesionales.");
    } finally {
      setIsSearching(false);
    }
  };

  const inviteProfessional = async (professionalId: number) => {
    if (!placeId) {
      setFeedbackMessage({
        type: 'error',
        message: "No encontramos el identificador de tu establecimiento. Vuelve a intentarlo o guarda tu perfil."
      });
      setTimeout(() => setFeedbackMessage({type: null, message: ''}), 5000);
      return;
    }
    try {
      setFeedbackMessage({type: null, message: ''}); // Clear previous messages
      await linkApi.inviteProfessionalToPlace(placeId, professionalId);
      setFeedbackMessage({
        type: 'success',
        message: "¡Invitación enviada! El profesional ha sido invitado a tu establecimiento."
      });
      setSearch("");
      setResults([]);
      setSelectedProfessionalId("");
      await fetchLinks(placeId);
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
    }
  };

  const removeLink = async (linkId: number) => {
    if (!placeId) return;
    try {
      await linkApi.removeLink(linkId);
      await fetchLinks(placeId);
    } catch (e) {
      Alert.alert("Error", "No se pudo eliminar el vínculo.");
    }
  };

  if (!isPlace) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 16, 20)},
          ]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>{headerTitle}</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centered}>
          <Text style={{color: colors.mutedForeground}}>Solo los establecimientos pueden vincular profesionales.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 16, 20)},
          ]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>{headerTitle}</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 16, 20)},
        ]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>{headerTitle}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={{padding: 16}}>
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

        {/* Search + Invite */}
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Invitar profesional</Text>
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Buscar por nombre, usuario o email"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, {borderColor: colors.border, color: colors.foreground}]}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={performSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchBtn, {backgroundColor: colors.primary}]}
            onPress={performSearch}
            disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="search" color="#fff" size={18} />
            )}
          </TouchableOpacity>
        </View>
        {/* Dropdown with search results */}
        {results.length > 0 && (
          <View style={{marginBottom: 8}}>
            <Dropdown
              options={results.map((pro) => {
                const name =
                  `${pro.first_name || ""} ${pro.last_name || ""}`.trim() ||
                  pro.username ||
                  pro.email ||
                  `#${pro.id}`;
                return {value: String(pro.id), label: name};
              })}
              selectedValue={selectedProfessionalId}
              onValueChange={(v) => setSelectedProfessionalId(v)}
              placeholder="Selecciona un profesional"
            />
            <TouchableOpacity
              style={[styles.inviteBtn, {backgroundColor: colors.primary, alignSelf: "flex-end"}]}
              onPress={() => {
                if (!selectedProfessionalId) {
                  Alert.alert("Selecciona un profesional", "Elige un usuario del dropdown para invitar.");
                  return;
                }
                inviteProfessional(Number(selectedProfessionalId));
              }}>
              <Text style={styles.inviteBtnText}>Invitar seleccionado</Text>
            </TouchableOpacity>
          </View>
        )}
        {results.length > 0 && (
          <View style={[styles.card, {borderColor: colors.border, backgroundColor: colors.card}]}>
            {results.map((pro) => {
              const display =
                `${pro.first_name || ""} ${pro.last_name || ""}`.trim() ||
                pro.username ||
                pro.email ||
                `#${pro.id}`;
            return (
              <View key={pro.id} style={styles.resultRow}>
                <View style={{flex: 1}}>
                  <Text style={{color: colors.foreground, fontWeight: "600"}}>{display}</Text>
                  {pro.email ? (
                    <Text style={{color: colors.mutedForeground, fontSize: 12}}>{pro.email}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[styles.inviteBtn, {backgroundColor: colors.primary}]}
                  onPress={() => inviteProfessional(pro.id)}>
                  <Text style={styles.inviteBtnText}>Invitar</Text>
                </TouchableOpacity>
              </View>
            )})}
          </View>
        )}

        {/* Invited */}
        <Text style={[styles.sectionTitle, {color: colors.foreground, marginTop: 12}]}>
          Invitaciones pendientes
        </Text>
        <View style={[styles.card, {borderColor: colors.border, backgroundColor: colors.card}]}>
          {linksInvited.length === 0 ? (
            <Text style={{color: colors.mutedForeground}}>No hay invitaciones pendientes.</Text>
          ) : (
            linksInvited.map((link) => (
              <View key={link.id} style={styles.linkRow}>
                <View style={{flex: 1}}>
                  <Text style={{color: colors.foreground, fontWeight: "600"}}>
                    {link.professional_name || link.professional_email || `#${link.professional_id}`}
                  </Text>
                  <Text style={{color: colors.mutedForeground, fontSize: 12}}>Estado: Invitado</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeLink(link.id)}
                  style={[styles.removeBtn, {borderColor: colors.border}]}>
                  <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Accepted */}
        <Text style={[styles.sectionTitle, {color: colors.foreground, marginTop: 12}]}>
          Profesionales vinculados
        </Text>
        <View style={[styles.card, {borderColor: colors.border, backgroundColor: colors.card}]}>
          {linksAccepted.length === 0 ? (
            <Text style={{color: colors.mutedForeground}}>Aún no hay profesionales vinculados.</Text>
          ) : (
            linksAccepted.map((link) => (
              <View key={link.id} style={styles.linkRow}>
                <View style={{flex: 1}}>
                  <Text style={{color: colors.foreground, fontWeight: "600"}}>
                    {link.professional_name || link.professional_email || `#${link.professional_id}`}
                  </Text>
                  <Text style={{color: colors.mutedForeground, fontSize: 12}}>Estado: Vinculado</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeLink(link.id)}
                  style={[styles.removeBtn, {borderColor: colors.border}]}>
                  <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  headerTitle: {fontSize: 18, fontWeight: "700"},
  centered: {flex: 1, alignItems: "center", justifyContent: "center"},
  sectionTitle: {fontSize: 14, fontWeight: "700", marginBottom: 6},
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchRow: {flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8},
  searchBtn: {paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10},
  card: {borderWidth: 1, borderRadius: 12, padding: 12},
  resultRow: {flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 8},
  inviteBtn: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10},
  inviteBtnText: {color: "#fff", fontWeight: "700"},
  linkRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
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


