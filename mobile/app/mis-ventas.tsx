import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect, useCallback} from "react";
import {useRouter} from "expo-router";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {AppHeader} from "@/components/ui/AppHeader";
import {ventasApi} from "@/lib/api";

const STATUS_LABEL: Record<string, string> = {
  DRAFT:     "Borrador",
  SENT:      "Enviada",
  PAID:      "Pagada",
  CANCELLED: "Cancelada",
  REFUNDED:  "Reembolsada",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT:     "#6b7280",
  SENT:      "#f59e0b",
  PAID:      "#22c55e",
  CANCELLED: "#ef4444",
  REFUNDED:  "#8b5cf6",
};

function formatCurrency(amount: string | number, currency = "MXN") {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {style: "currency", currency, minimumFractionDigits: 0}).format(n);
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {day: "numeric", month: "short", year: "numeric"});
}

export default function MisVentasScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      const [summaryRes, listRes] = await Promise.all([
        ventasApi.summary(),
        ventasApi.list(),
      ]);
      setSummary(summaryRes.data);
      setSales(Array.isArray(listRes.data?.results) ? listRes.data.results : []);
    } catch {
      setSales([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({item}: {item: any}) => {
    const status = item.status ?? "DRAFT";
    const color = STATUS_COLOR[status] ?? "#6b7280";
    return (
      <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={s.cardRow}>
          <View style={s.cardLeft}>
            <Text style={[s.saleNum, {color: colors.mutedForeground}]}>#{item.sale_number ?? item.id}</Text>
            <Text style={[s.clientName, {color: colors.foreground}]} numberOfLines={1}>
              {item.client_name || "Sin cliente"}
            </Text>
            {item.created_at && (
              <Text style={[s.dateText, {color: colors.mutedForeground}]}>{formatDate(item.created_at)}</Text>
            )}
          </View>
          <View style={s.cardRight}>
            <Text style={[s.amount, {color: colors.foreground}]}>
              {formatCurrency(item.total ?? 0, item.currency)}
            </Text>
            <View style={[s.statusBadge, {backgroundColor: color + "18", borderColor: color + "40"}]}>
              <Text style={[s.statusText, {color}]}>{STATUS_LABEL[status] ?? status}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const primaryCurrency = summary?.by_currency
    ? Object.keys(summary.by_currency)[0] ?? "MXN"
    : "MXN";

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader title="Mis Ventas" showBackButton onBackPress={() => router.back()} />

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          onRefresh={() => load(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.list, sales.length === 0 && s.emptyContainer]}
          ListHeaderComponent={
            summary ? (
              <View style={s.statsRow}>
                <View style={[s.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[s.statValue, {color: "#22c55e"}]}>
                    {formatCurrency(summary.paid_revenue ?? 0, primaryCurrency)}
                  </Text>
                  <Text style={[s.statLabel, {color: colors.mutedForeground}]}>Cobrado</Text>
                </View>
                <View style={[s.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[s.statValue, {color: "#f59e0b"}]}>
                    {formatCurrency(summary.pending_revenue ?? 0, primaryCurrency)}
                  </Text>
                  <Text style={[s.statLabel, {color: colors.mutedForeground}]}>Pendiente</Text>
                </View>
                <View style={[s.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[s.statValue, {color: colors.foreground}]}>{summary.total_sales ?? 0}</Text>
                  <Text style={[s.statLabel, {color: colors.mutedForeground}]}>Ventas</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, {color: colors.foreground}]}>Sin ventas registradas</Text>
              <Text style={[s.emptyDesc, {color: colors.mutedForeground}]}>
                Tus ventas y pagos recibidos aparecerán aquí.
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
  center: {flex: 1, justifyContent: "center", alignItems: "center"},
  list: {padding: 16, gap: 12},
  emptyContainer: {flex: 1},
  empty: {flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 32},
  emptyTitle: {fontSize: 17, fontWeight: "700", textAlign: "center"},
  emptyDesc: {fontSize: 14, lineHeight: 20, textAlign: "center"},

  statsRow: {flexDirection: "row", gap: 10, marginBottom: 4},
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  statValue: {fontSize: 16, fontWeight: "800"},
  statLabel: {fontSize: 11, fontWeight: "500"},

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  cardRow: {flexDirection: "row", alignItems: "center", gap: 12},
  cardLeft: {flex: 1, gap: 2},
  cardRight: {alignItems: "flex-end", gap: 6},
  saleNum: {fontSize: 11, fontWeight: "500"},
  clientName: {fontSize: 15, fontWeight: "600"},
  dateText: {fontSize: 12},
  amount: {fontSize: 16, fontWeight: "700"},
  statusBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1},
  statusText: {fontSize: 11, fontWeight: "700"},
});
