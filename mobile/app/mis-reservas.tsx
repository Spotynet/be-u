import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {reservationApi} from "@/lib/api";

type Filter = "upcoming" | "past";

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  REJECTED:  "Rechazada",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#f59e0b",
  CONFIRMED: "#22c55e",
  CANCELLED: "#ef4444",
  COMPLETED: "#6b7280",
  REJECTED:  "#ef4444",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {weekday: "short", day: "numeric", month: "short", year: "numeric"});
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", {hour: "2-digit", minute: "2-digit"});
}

export default function MisReservasScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("upcoming");
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const res = await reservationApi.getMyReservations({filter});
      setReservations(Array.isArray(res.data?.results) ? res.data.results : []);
    } catch {
      setReservations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({item}: {item: any}) => {
    const status = item.status ?? "PENDING";
    const color = STATUS_COLOR[status] ?? "#6b7280";
    const serviceName = item.service?.name ?? item.service_name ?? "Servicio";
    const providerName = item.professional_name ?? item.place_name ?? item.provider_name ?? "";
    const start = item.start_datetime ?? item.date;

    return (
      <TouchableOpacity
        style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}
        onPress={() => router.push(`/reservation/${item.id}`)}
        activeOpacity={0.75}>
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <Text style={[s.serviceName, {color: colors.foreground}]} numberOfLines={1}>{serviceName}</Text>
            {!!providerName && (
              <Text style={[s.providerName, {color: colors.mutedForeground}]} numberOfLines={1}>{providerName}</Text>
            )}
            {!!start && (
              <View style={s.dateRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                <Text style={[s.dateText, {color: colors.mutedForeground}]}>
                  {formatDate(start)} · {formatTime(start)}
                </Text>
              </View>
            )}
          </View>
          <View style={[s.statusBadge, {backgroundColor: color + "18", borderColor: color + "40"}]}>
            <Text style={[s.statusText, {color}]}>{STATUS_LABEL[status] ?? status}</Text>
          </View>
        </View>
        <View style={s.cardFooter}>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader title="Mis Reservas" showBackButton onBackPress={() => router.back()} />

      {/* Filter tabs */}
      <View style={[s.tabs, {borderBottomColor: colors.border}]}>
        {(["upcoming", "past"] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.tab, filter === f && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}>
            <Text style={[s.tabText, {color: filter === f ? colors.primary : colors.mutedForeground}]}>
              {f === "upcoming" ? "Próximas" : "Pasadas"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[s.list, reservations.length === 0 && s.emptyContainer]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => load(true)}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, {color: colors.foreground}]}>
                {filter === "upcoming" ? "Sin reservas próximas" : "Sin reservas pasadas"}
              </Text>
              <Text style={[s.emptyDesc, {color: colors.mutedForeground}]}>
                {filter === "upcoming"
                  ? "Cuando hagas una reserva aparecerá aquí."
                  : "Tu historial de reservas aparecerá aquí."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  tabs: {flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth},
  tab: {flex: 1, alignItems: "center", paddingVertical: 12},
  tabText: {fontSize: 14, fontWeight: "600"},
  center: {flex: 1, justifyContent: "center", alignItems: "center"},
  list: {padding: 16, gap: 12},
  emptyContainer: {flex: 1},
  empty: {flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 32},
  emptyTitle: {fontSize: 17, fontWeight: "700", textAlign: "center"},
  emptyDesc: {fontSize: 14, lineHeight: 20, textAlign: "center"},
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  cardTop: {flexDirection: "row", alignItems: "flex-start", gap: 12},
  cardLeft: {flex: 1, gap: 3},
  serviceName: {fontSize: 15, fontWeight: "600"},
  providerName: {fontSize: 13},
  dateRow: {flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2},
  dateText: {fontSize: 12},
  statusBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1},
  statusText: {fontSize: 11, fontWeight: "700"},
  cardFooter: {alignItems: "flex-end", marginTop: 4},
});
