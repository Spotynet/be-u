import {useState, useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {groupSessionApi} from "@/lib/api";
import {useAuth} from "@/features/auth";

export type GroupSessionItem = {
  id: number;
  date: string;
  time: string;
  service_name: string;
  capacity: number;
  booked_slots: number;
  remaining_slots: number;
};

type Props = {
  selectedSessionId: number | null;
  onSelect: (id: number | null) => void;
  colors: Record<string, string>;
};

export function LinkedGroupSessionSelector({
  selectedSessionId,
  onSelect,
  colors,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [sessions, setSessions] = useState<GroupSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();

  // Only professionals and places can have group sessions
  const canHaveSessions = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  useEffect(() => {
    if (!canHaveSessions) return;
    let cancelled = false;
    setLoading(true);
    groupSessionApi
      .list({date_from: new Date().toISOString().slice(0, 10)})
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.results ?? [];
        const items: GroupSessionItem[] = list
          .filter((s: any) => (s.remaining_slots ?? s.capacity - s.booked_slots) > 0)
          .map((s: any) => ({
            id: s.id,
            date: s.date,
            time: String(s.time ?? "").slice(0, 5),
            service_name: s.service_name ?? "Sesión grupal",
            capacity: s.capacity ?? 1,
            booked_slots: s.booked_slots ?? 0,
            remaining_slots: s.remaining_slots ?? Math.max(0, (s.capacity ?? 1) - (s.booked_slots ?? 0)),
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

  if (!canHaveSessions) return null;
  if (loading && sessions.length === 0) return null;

  const selectedSession = selectedSessionId != null
    ? sessions.find((s) => s.id === selectedSessionId)
    : null;

  const openPicker = () => setModalVisible(true);
  const closePicker = () => setModalVisible(false);
  const handleSelect = (id: number | null) => {
    onSelect(id);
    closePicker();
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", {weekday: "short", day: "numeric", month: "short"});
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={[styles.label, {color: colors.foreground}]}>SESIÓN GRUPAL</Text>
        {selectedSession ? (
          <View
            style={[
              styles.linkedCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.linkedCardLeft}>
              <Text style={[styles.linkedName, {color: colors.foreground}]} numberOfLines={1}>
                {selectedSession.service_name}
              </Text>
              <Text style={[styles.linkedMeta, {color: colors.mutedForeground}]}>
                {formatDateDisplay(selectedSession.date)} · {selectedSession.time} ·{" "}
                {selectedSession.booked_slots}/{selectedSession.capacity} plazas
              </Text>
            </View>
            <View style={styles.linkedCardActions}>
              <TouchableOpacity
                onPress={openPicker}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="pencil-outline" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSelect(null)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="close" color={colors.mutedForeground} size={22} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openPicker}
            style={[
              styles.card,
              {
                borderColor: colors.primary + "80",
                backgroundColor: colors.card,
              },
            ]}>
            <View style={styles.emptyContent}>
              <View style={[styles.plusCircle, {backgroundColor: colors.primary}]}>
                <Ionicons name="people" color="#FFFFFF" size={24} />
              </View>
              <Text style={[styles.primaryText, {color: colors.foreground}]}>
                Vincular sesión grupal
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}>
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.modalContent, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Elegir sesión grupal
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    {borderColor: colors.border, backgroundColor: colors.input},
                    selectedSessionId === null && {borderColor: colors.primary, borderWidth: 2},
                  ]}
                  onPress={() => handleSelect(null)}>
                  <Text style={[styles.optionName, {color: colors.foreground}]}>Ninguna</Text>
                </TouchableOpacity>
                {sessions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.optionRow,
                      {borderColor: colors.border, backgroundColor: colors.input},
                      selectedSessionId === s.id && {borderColor: colors.primary, borderWidth: 2},
                    ]}
                    onPress={() => handleSelect(s.id)}>
                    <Text style={[styles.optionName, {color: colors.foreground}]}>{s.service_name}</Text>
                    <Text style={[styles.optionMeta, {color: colors.mutedForeground}]}>
                      {formatDateDisplay(s.date)} · {s.time} · {s.booked_slots}/{s.capacity} plazas
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <TouchableOpacity
              style={[styles.cancelButton, {borderColor: colors.border}]}
              onPress={closePicker}>
              <Text style={[styles.cancelButtonText, {color: colors.foreground}]}>
                Cerrar
              </Text>
            </TouchableOpacity>
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
    justifyContent: "space-between",
  },
  linkedCardLeft: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  linkedName: {
    fontSize: 16,
    fontWeight: "700",
  },
  linkedMeta: {
    fontSize: 14,
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
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  loader: {
    marginVertical: 24,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
