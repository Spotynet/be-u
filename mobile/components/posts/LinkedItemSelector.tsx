import {useState, useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {groupSessionApi} from "@/lib/api";
import {useAuth} from "@/features/auth";
import {formatPrice} from "@/lib/priceUtils";

export type CustomServiceItem = {
  id: number;
  name: string;
  price: string;
  duration_minutes?: number;
  category?: string;
};

type GroupSessionItem = {
  id: number;
  date: string;
  time: string;
  service_name: string;
  service_sub_category: string | null;
  sub_category: string | null;
  capacity: number;
  booked_slots: number;
  remaining_slots: number;
};

const SUB_TO_MAIN: Record<string, string> = {
  cabello: "belleza",
  barberia: "belleza",
  spa_relajacion: "bienestar",
  yoga: "bienestar",
  meditacion: "bienestar",
  nutricion_alimentacion: "bienestar",
  fisioterapia: "bienestar",
  entrenamiento: "bienestar",
  psicologia: "bienestar",
  terapias_alternativas: "bienestar",
  estetica_mascotas: "mascotas",
  spa_mascotas: "mascotas",
  cuidadores: "mascotas",
  paseadores: "mascotas",
};

type Props = {
  customServices: CustomServiceItem[];
  linkedServiceId: number | null;
  linkedGroupSessionId: number | null;
  onSelectService: (id: number | null) => void;
  onSelectGroupSession: (id: number | null) => void;
  colors: Record<string, string>;
  subcategoryFilter?: string | null;
};

export function LinkedItemSelector({
  customServices,
  linkedServiceId,
  linkedGroupSessionId,
  onSelectService,
  onSelectGroupSession,
  colors,
  subcategoryFilter,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [sessions, setSessions] = useState<GroupSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  const canHaveSessions = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  useEffect(() => {
    if (!canHaveSessions) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    groupSessionApi
      .list({date_from: new Date().toISOString().slice(0, 10)})
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.results ?? [];
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const items: GroupSessionItem[] = list
          .filter((s: any) => {
            if ((s.remaining_slots ?? s.capacity - s.booked_slots) <= 0) return false;
            if (s.date < todayStr) return false;
            if (s.date === todayStr) {
              const [h, m] = String(s.time ?? "00:00").slice(0, 5).split(":").map(Number);
              if ((h || 0) * 60 + (m || 0) <= nowMinutes) return false;
            }
            return true;
          })
          .map((s: any) => ({
            id: s.id,
            date: s.date,
            time: String(s.time ?? "").slice(0, 5),
            service_name: s.service_name ?? "Sesión grupal",
            service_sub_category: s.service_sub_category ?? null,
            sub_category: s.sub_category ?? null,
            capacity: s.capacity ?? 1,
            booked_slots: s.booked_slots ?? 0,
            remaining_slots:
              s.remaining_slots ?? Math.max(0, (s.capacity ?? 1) - (s.booked_slots ?? 0)),
          }));
        setSessions(items);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canHaveSessions]);

  // Apply subcategory filter to both lists
  const requiredMainCategory = subcategoryFilter
    ? (SUB_TO_MAIN[subcategoryFilter.toLowerCase()] ?? null)
    : null;

  const filteredServices = requiredMainCategory
    ? customServices.filter(
        (s) => !s.category || s.category.toLowerCase() === requiredMainCategory.toLowerCase()
      )
    : customServices;

  const filteredSessions = subcategoryFilter
    ? sessions.filter(
        (s) =>
          (s.sub_category != null &&
            s.sub_category.toLowerCase() === subcategoryFilter.toLowerCase()) ||
          (s.service_sub_category != null &&
            s.service_sub_category.toLowerCase() === subcategoryFilter.toLowerCase())
      )
    : sessions;

  // Auto-clear when selected items no longer appear after filter change
  useEffect(() => {
    if (linkedServiceId != null && !filteredServices.find((s) => s.id === linkedServiceId)) {
      onSelectService(null);
    }
    if (
      linkedGroupSessionId != null &&
      !filteredSessions.find((s) => s.id === linkedGroupSessionId)
    ) {
      onSelectGroupSession(null);
    }
  }, [subcategoryFilter]);

  const selectedService =
    linkedServiceId != null ? filteredServices.find((s) => s.id === linkedServiceId) : null;
  const selectedSession =
    linkedGroupSessionId != null
      ? filteredSessions.find((s) => s.id === linkedGroupSessionId)
      : null;

  const hasAnything = filteredServices.length > 0 || (canHaveSessions && filteredSessions.length > 0);
  const hasSelection = selectedService != null || selectedSession != null;

  if (!loading && !hasAnything) return null;

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", {weekday: "short", day: "numeric", month: "short"});
  };

  const handleSelectService = (id: number | null) => {
    onSelectService(id);
    if (id != null) onSelectGroupSession(null);
    setModalVisible(false);
  };

  const handleSelectSession = (id: number | null) => {
    onSelectGroupSession(id);
    if (id != null) onSelectService(null);
    setModalVisible(false);
  };

  const handleClear = () => {
    onSelectService(null);
    onSelectGroupSession(null);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={[styles.label, {color: colors.foreground}]}>SERVICIO / SESIÓN GRUPAL</Text>

        {hasSelection ? (
          <View
            style={[styles.linkedCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View
              style={[
                styles.typeIcon,
                {backgroundColor: selectedSession ? colors.primary + "20" : colors.primary + "15"},
              ]}>
              <Ionicons
                name={selectedSession ? "people" : "briefcase-outline"}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.linkedCardLeft}>
              {selectedService && (
                <>
                  <Text
                    style={[styles.linkedName, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {selectedService.name}
                  </Text>
                  <Text style={[styles.linkedMeta, {color: colors.primary}]}>
                    {formatPrice(selectedService.price, {suffix: " MXN"})}
                  </Text>
                </>
              )}
              {selectedSession && (
                <>
                  <Text
                    style={[styles.linkedName, {color: colors.foreground}]}
                    numberOfLines={1}>
                    {selectedSession.service_name}
                  </Text>
                  <Text style={[styles.linkedMeta, {color: colors.mutedForeground}]}>
                    {formatDateDisplay(selectedSession.date)} · {selectedSession.time} ·{" "}
                    {selectedSession.booked_slots}/{selectedSession.capacity} plazas
                  </Text>
                </>
              )}
            </View>
            <View style={styles.linkedCardActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="pencil-outline" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="close" color={colors.mutedForeground} size={22} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setModalVisible(true)}
            style={[styles.card, {borderColor: colors.primary + "80", backgroundColor: colors.card}]}>
            <View style={styles.emptyContent}>
              <View style={[styles.plusCircle, {backgroundColor: colors.primary}]}>
                <Ionicons name="add" color="#FFFFFF" size={24} />
              </View>
              <Text style={[styles.primaryText, {color: colors.foreground}]}>
                Vincular servicio o sesión grupal
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalContent, {backgroundColor: colors.card}]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, {borderBottomColor: colors.border}]}>
              <Text style={[styles.modalTitle, {color: colors.foreground}]}>
                Vincular a publicación
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* Ninguno */}
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  {borderColor: colors.border, backgroundColor: colors.input},
                  !hasSelection && {borderColor: colors.primary, borderWidth: 2},
                ]}
                onPress={() => {
                  handleClear();
                  setModalVisible(false);
                }}>
                <Text style={[styles.optionName, {color: colors.mutedForeground}]}>
                  Sin vincular
                </Text>
              </TouchableOpacity>

              {/* Sesiones grupales */}
              {canHaveSessions && (
                <>
                  <View style={[styles.sectionDivider, {borderBottomColor: colors.border}]}>
                    <View style={styles.sectionDividerLeft}>
                      <Ionicons name="people" size={14} color={colors.primary} />
                      <Text style={[styles.sectionDividerText, {color: colors.primary}]}>
                        Sesiones grupales
                      </Text>
                    </View>
                  </View>

                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={styles.loader}
                    />
                  ) : filteredSessions.length === 0 ? (
                    <Text style={[styles.emptySection, {color: colors.mutedForeground}]}>
                      Sin sesiones próximas disponibles
                    </Text>
                  ) : (
                    filteredSessions.map((s) => {
                      const active = linkedGroupSessionId === s.id;
                      return (
                        <TouchableOpacity
                          key={`gs-${s.id}`}
                          style={[
                            styles.optionRow,
                            {borderColor: colors.border, backgroundColor: colors.input},
                            active && {borderColor: colors.primary, borderWidth: 2},
                          ]}
                          onPress={() => handleSelectSession(s.id)}>
                          <View style={styles.optionRowInner}>
                            <View style={styles.optionRowContent}>
                              <Text style={[styles.optionName, {color: colors.foreground}]}>
                                {s.service_name}
                              </Text>
                              <Text style={[styles.optionMeta, {color: colors.mutedForeground}]}>
                                {formatDateDisplay(s.date)} · {s.time} ·{" "}
                                {s.booked_slots}/{s.capacity} plazas
                              </Text>
                            </View>
                            {active && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.primary}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </>
              )}

              {/* Servicios */}
              {filteredServices.length > 0 && (
                <>
                  <View style={[styles.sectionDivider, {borderBottomColor: colors.border}]}>
                    <View style={styles.sectionDividerLeft}>
                      <Ionicons name="briefcase-outline" size={14} color={colors.primary} />
                      <Text style={[styles.sectionDividerText, {color: colors.primary}]}>
                        Servicios
                      </Text>
                    </View>
                  </View>

                  {filteredServices.map((s) => {
                    const active = linkedServiceId === s.id;
                    return (
                      <TouchableOpacity
                        key={`svc-${s.id}`}
                        style={[
                          styles.optionRow,
                          {borderColor: colors.border, backgroundColor: colors.input},
                          active && {borderColor: colors.primary, borderWidth: 2},
                        ]}
                        onPress={() => handleSelectService(s.id)}>
                        <View style={styles.optionRowInner}>
                          <View style={styles.optionRowContent}>
                            <Text style={[styles.optionName, {color: colors.foreground}]}>
                              {s.name}
                            </Text>
                            <Text style={[styles.optionMeta, {color: colors.mutedForeground}]}>
                              {formatPrice(s.price, {suffix: " MXN"})} ·{" "}
                              {s.duration_minutes ?? 60} min
                            </Text>
                          </View>
                          {active && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.primary}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              <View style={{height: 16}} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyContent: {
    alignItems: "center",
    gap: 10,
  },
  plusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkedCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  linkedCardLeft: {
    flex: 1,
    justifyContent: "center",
  },
  linkedName: {
    fontSize: 15,
    fontWeight: "700",
  },
  linkedMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  linkedCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalList: {
    padding: 16,
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionDividerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionDividerText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loader: {
    marginVertical: 16,
  },
  emptySection: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionRowInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionRowContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionMeta: {
    fontSize: 13,
    marginTop: 4,
  },
});
