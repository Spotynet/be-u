import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import React, {useState, useEffect, useMemo, useCallback, useRef} from "react";
import {useRouter} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useAuth} from "@/features/auth";
import {useReservations, useIncomingReservations} from "@/features/reservations";
import {MonthPicker, ReservationCard} from "@/components/calendar";
import {Reservation} from "@/types/global";
import {parseISODateAsLocal} from "@/lib/dateUtils";
import {linkApi, providerApi, reservationApi} from "@/lib/api";
import {Image} from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────
interface EnhancedReservationsTabProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

type TimeTab   = "upcoming" | "history";
type DateRange = "all" | "today" | "week" | "month" | "custom";
type StatusKey = "all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";

// ── Option lists ──────────────────────────────────────────────────────────────
const DATE_OPTIONS: {id: DateRange; label: string}[] = [
  {id: "all",    label: "Todas las fechas"},
  {id: "today",  label: "Hoy"},
  {id: "week",   label: "Esta semana"},
  {id: "month",  label: "Este mes"},
  {id: "custom", label: "Fecha específica…"},
];

const STATUS_META: Record<string, {label: string; color: string}> = {
  PENDING:   {label: "Pendiente",  color: "#f59e0b"},
  CONFIRMED: {label: "Confirmada", color: "#10b981"},
  COMPLETED: {label: "Completada", color: "#6b7280"},
  CANCELLED: {label: "Cancelada",  color: "#ef4444"},
  REJECTED:  {label: "Rechazada",  color: "#dc2626"},
};

const ALL_STATUS_OPTIONS: FilterOption<StatusKey>[] = [
  {id: "all",       label: "Todos los estados"},
  {id: "PENDING",   label: "Pendiente",  dot: "#f59e0b"},
  {id: "CONFIRMED", label: "Confirmada", dot: "#10b981"},
  {id: "COMPLETED", label: "Completada", dot: "#6b7280"},
  {id: "CANCELLED", label: "Cancelada",  dot: "#ef4444"},
  {id: "REJECTED",  label: "Rechazada",  dot: "#dc2626"},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getWeekBounds() {
  const now = new Date(), dow = (now.getDay() + 6) % 7;
  const start = new Date(now); start.setDate(now.getDate() - dow);
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  return {start: toLocalISO(start), end: toLocalISO(end)};
}
function getMonthBounds() {
  const now = new Date();
  return {
    start: toLocalISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    end:   toLocalISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}
function formatShortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {day: "numeric", month: "short"});
}

// ── FilterDropdown — anchored popover (same pattern as HeaderCategoryDropdown) ──
interface FilterOption<T extends string> {
  id: T;
  label: string;
  dot?: string;
}

const SCREEN_W       = Dimensions.get("window").width;
const MENU_MIN_W     = 190;
const SCREEN_EDGE_PAD = 10;

function clampLeft(triggerX: number, triggerW: number, menuW: number) {
  const ideal = triggerX;
  return Math.max(SCREEN_EDGE_PAD, Math.min(ideal, SCREEN_W - menuW - SCREEN_EDGE_PAD));
}

function FilterDropdown<T extends string>({
  label,
  value,
  displayValue,
  options,
  onChange,
  colors,
}: {
  label: string;
  value: T;
  displayValue: string;
  options: FilterOption<T>[];
  onChange: (id: T) => void;
  colors: any;
}) {
  const triggerRef = useRef<View>(null);
  const [open,   setOpen]   = useState(false);
  const [anchor, setAnchor] = useState({x: 0, y: 0, w: 0});
  const anim = useRef(new Animated.Value(0)).current;

  const isDefault = value === options[0]?.id;

  const openMenu = () => {
    triggerRef.current?.measure((_fx, _fy, width, height, pageX, pageY) => {
      setAnchor({x: pageX, y: pageY + height + 6, w: Math.max(width, MENU_MIN_W)});
      setOpen(true);
      anim.setValue(0);
      Animated.spring(anim, {toValue: 1, useNativeDriver: true, tension: 300, friction: 26}).start();
    });
  };

  const closeMenu = (cb?: () => void) => {
    Animated.timing(anim, {toValue: 0, duration: 130, useNativeDriver: true}).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const handleSelect = (id: T) => closeMenu(() => onChange(id));

  const menuOpacity    = anim;
  const menuScale      = anim.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]});
  const menuTranslateY = anim.interpolate({inputRange: [0, 1], outputRange: [-8, 0]});
  const chevronRotate  = anim.interpolate({inputRange: [0, 1], outputRange: ["0deg", "180deg"]});

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={d.triggerWrap}>
        <Pressable
          onPress={open ? () => closeMenu() : openMenu}
          style={({pressed}) => [
            d.trigger,
            {
              backgroundColor: colors.card,
              borderColor: open
                ? colors.primary + "50"
                : !isDefault ? colors.primary + "40" : colors.border,
            },
            !isDefault && {backgroundColor: colors.primary + "06"},
            pressed && {opacity: 0.85},
          ]}>
          <View style={d.triggerLeft}>
            <Text style={[d.triggerLabel, {color: colors.mutedForeground}]}>{label}</Text>
            <Text
              style={[d.triggerValue, {color: !isDefault ? colors.primary : colors.foreground}]}
              numberOfLines={1}>
              {displayValue}
            </Text>
          </View>
          <Animated.View style={{transform: [{rotate: chevronRotate}]}}>
            <Ionicons
              name="chevron-down"
              size={15}
              color={open || !isDefault ? colors.primary : colors.mutedForeground}
            />
          </Animated.View>
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeMenu()}>
        {/* Invisible scrim — captures outside taps */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />

        <Animated.View
          style={[
            d.menu,
            {
              top:              anchor.y,
              left:             clampLeft(anchor.x, anchor.w, anchor.w),
              width:            anchor.w,
              backgroundColor:  colors.card,
              borderColor:      colors.border,
              opacity:          menuOpacity,
              transform: [
                {translateY: menuTranslateY},
                {scaleX: menuScale},
                {scaleY: menuScale},
              ],
            },
          ]}>
          {options.map((opt, idx) => {
            const selected = value === opt.id;
            const isLast   = idx === options.length - 1;
            return (
              <View key={opt.id}>
                <Pressable
                  style={({pressed}) => [
                    d.row,
                    selected && {backgroundColor: colors.primary + "0D"},
                    pressed && !selected && {backgroundColor: colors.muted},
                  ]}
                  onPress={() => handleSelect(opt.id)}>
                  {/* Dot badge */}
                  <View style={[
                    d.dotWrap,
                    {backgroundColor: opt.dot ? opt.dot + "18" : colors.muted},
                  ]}>
                    {opt.dot
                      ? <View style={[d.dot, {backgroundColor: opt.dot}]} />
                      : <Ionicons name="list-outline" size={13} color={colors.mutedForeground} />
                    }
                  </View>

                  <Text style={[
                    d.rowLabel,
                    {color: selected ? colors.primary : colors.foreground},
                    selected && {fontWeight: "700"},
                  ]}>
                    {opt.label}
                  </Text>

                  {selected && <Ionicons name="checkmark" size={15} color={colors.primary} />}
                </Pressable>
                {!isLast && <View style={[d.divider, {backgroundColor: colors.border}]} />}
              </View>
            );
          })}
        </Animated.View>
      </Modal>
    </>
  );
}

const d = StyleSheet.create({
  triggerWrap: {flex: 1},
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    ...Platform.select({
      ios:     {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 4},
      android: {elevation: 1},
    }),
  },
  triggerLeft:  {flex: 1, gap: 2},
  triggerLabel: {fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase"},
  triggerValue: {fontSize: 14, fontWeight: "600"},

  // Floating menu
  menu: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios:     {shadowColor: "#000", shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.14, shadowRadius: 20},
      android: {elevation: 18},
    }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 11,
  },
  dotWrap: {width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center"},
  dot:     {width: 8, height: 8, borderRadius: 4},
  rowLabel:{flex: 1, fontSize: 14, fontWeight: "500"},
  divider: {height: StyleSheet.hairlineWidth, marginHorizontal: 14},
});

// ── Tab switcher ──────────────────────────────────────────────────────────────
function TabSwitcher({value, onChange, colors}: {value: TimeTab; onChange: (t: TimeTab) => void; colors: any}) {
  const slideAnim = useRef(new Animated.Value(value === "upcoming" ? 0 : 1)).current;
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: value === "upcoming" ? 0 : 1,
      useNativeDriver: true, friction: 10, tension: 140,
    }).start();
  }, [value]);

  const indicatorX = slideAnim.interpolate({inputRange: [0, 1], outputRange: [0, tabWidth]});

  return (
    <View
      style={[ts.wrap, {borderBottomColor: colors.border}]}
      onLayout={(e) => setTabWidth(e.nativeEvent.layout.width / 2)}>
      {(["upcoming", "history"] as TimeTab[]).map((tab) => {
        const active = value === tab;
        return (
          <TouchableOpacity key={tab} style={ts.tab} onPress={() => onChange(tab)} activeOpacity={0.7}>
            <Text style={[ts.label, {color: active ? colors.foreground : colors.mutedForeground}, active && ts.labelActive]}>
              {tab === "upcoming" ? "Próximas" : "Historial"}
            </Text>
          </TouchableOpacity>
        );
      })}
      <Animated.View style={[ts.indicator, {backgroundColor: colors.primary, width: tabWidth, transform: [{translateX: indicatorX}]}]} />
    </View>
  );
}

const ts = StyleSheet.create({
  wrap:         {flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, position: "relative"},
  tab:          {flex: 1, paddingVertical: 14, alignItems: "center"},
  label:        {fontSize: 14, fontWeight: "500", letterSpacing: 0.1},
  labelActive:  {fontWeight: "700"},
  indicator:    {position: "absolute", bottom: 0, left: 0, height: 2, borderRadius: 2},
});

// ── Main component ────────────────────────────────────────────────────────────
export function EnhancedReservationsTab({userRole}: EnhancedReservationsTabProps) {
  const {colors}  = useThemeVariant();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();

  const [timeTab,      setTimeTab]      = useState<TimeTab>("upcoming");
  const [dateRange,    setDateRange]    = useState<DateRange>("all");
  const [customDate,   setCustomDate]   = useState<string | null>(null);
  const [showPicker,   setShowPicker]   = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [teamLinks,    setTeamLinks]    = useState<any[]>([]);
  const [teamFilterId, setTeamFilterId] = useState<number | "all">("all");
  const [teamReservations, setTeamReservations] = useState<Reservation[]>([]);
  const [teamLoading,  setTeamLoading]  = useState(false);
  const [teamError,    setTeamError]    = useState<string | null>(null);

  const isClient   = userRole === "CLIENT";
  const isProvider = userRole === "PROFESSIONAL" || userRole === "PLACE";
  const isPlace    = userRole === "PLACE";

  const handleSetTimeTab = (tab: TimeTab) => { setTimeTab(tab); setStatusFilter("all"); };

  const handleDateChange = (id: DateRange) => {
    if (id === "custom") { setShowPicker(true); return; }
    setDateRange(id);
    setCustomDate(null);
  };

  const handleCustomDateSelect = (iso: string) => {
    setCustomDate(iso);
    setDateRange("custom");
    setShowPicker(false);
  };

  // Display labels for triggers
  const dateDisplayValue = useMemo(() => {
    if (dateRange === "custom" && customDate) return formatShortDate(customDate);
    return DATE_OPTIONS.find(o => o.id === dateRange)?.label ?? "Todas las fechas";
  }, [dateRange, customDate]);

  const statusDisplayValue = useMemo(() => {
    if (statusFilter === "all") return "Todos";
    return STATUS_META[statusFilter]?.label ?? "Todos";
  }, [statusFilter]);

  // Status options vary by tab
  const statusOptions = ALL_STATUS_OPTIONS;

  // ── Data ──────────────────────────────────────────────────────────────────────
  const {
    reservations: clientRes, isLoading: clientLoading, error: clientError,
    refreshReservations: refreshClient, cancelReservation,
  } = useReservations(user?.id, {asClient: isClient});

  const {
    reservations: providerRes, isLoading: providerLoading, error: providerError,
    setFilter, refreshReservations: refreshProvider,
    confirmReservation, rejectReservation, completeReservation,
    cancelReservation: providerCancel,
  } = useIncomingReservations();

  const cancelFn     = isClient ? cancelReservation : providerCancel;
  const reservations = isClient ? clientRes : isPlace ? teamReservations : providerRes;
  const isLoading    = isClient ? clientLoading  : isPlace ? teamLoading  : providerLoading;
  const error        = isClient ? clientError    : isPlace ? teamError    : providerError;
  const refresh      = isClient ? refreshClient  : isPlace ? fetchTeamReservations : refreshProvider;

  const fetchTeamLinks = useCallback(async () => {
    try {
      const res = await linkApi.listMyLinks({status: "ACCEPTED"});
      const links = Array.isArray(res.data) ? res.data : [];
      const enriched = await Promise.all(links.map(async (l: any) => {
        try {
          const prof = await providerApi.getPublicProfile(Number(l.professional_public_profile_id || l.professional_id));
          return {...l, user_image: prof.data?.user_image || null};
        } catch { return {...l, user_image: null}; }
      }));
      setTeamLinks(enriched);
    } catch { setTeamLinks([]); }
  }, []);

  async function fetchTeamReservations() {
    try {
      setTeamLoading(true); setTeamError(null);
      const params: any = {status: "all"};
      if (teamFilterId !== "all") { params.provider_type = "professional"; params.provider_id = teamFilterId; }
      const res = await reservationApi.getTeamReservations(params);
      setTeamReservations(res.data?.results || []);
    } catch (e: any) {
      setTeamError((e?.response?.data?.error || e?.message || "Error").toString());
    } finally { setTeamLoading(false); }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isClient) refreshClient();
    else if (isPlace) { fetchTeamLinks(); fetchTeamReservations(); }
    else { setFilter("all" as any); refreshProvider(); }
  }, [isAuthenticated, userRole]);

  useEffect(() => {
    if (isAuthenticated && isPlace) fetchTeamReservations();
  }, [isAuthenticated, isPlace, teamFilterId]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleConfirm = (id: number) => {
    if (Platform.OS === "web") { confirmReservation(id).catch(() => {}); return; }
    Alert.alert("Confirmar Reserva", "¿Confirmar esta reserva?", [
      {text: "Cancelar", style: "cancel"},
      {text: "Confirmar", onPress: () => confirmReservation(id).catch(() => {})},
    ]);
  };
  const handleReject = (id: number) => {
    if (Platform.OS === "web") { rejectReservation(id, "").catch(() => {}); return; }
    Alert.prompt("Rechazar Reserva", "¿Por qué rechazas?", [
      {text: "Cancelar", style: "cancel"},
      {text: "Rechazar", style: "destructive", onPress: (r) => rejectReservation(id, r ?? "").catch(() => {})},
    ], "plain-text");
  };
  const handleCancel = (id: number) => {
    if (Platform.OS === "web") { cancelFn(id).catch(() => {}); if (isPlace) fetchTeamReservations(); return; }
    Alert.prompt("Cancelar Reserva", "¿Por qué cancelas? (opcional)", [
      {text: "No cancelar", style: "cancel"},
      {text: "Cancelar Reserva", style: "destructive", onPress: async (r) => {
        await cancelFn(id, r).catch(() => {});
        if (isPlace) fetchTeamReservations();
      }},
    ], "plain-text");
  };
  const handleComplete = (id: number) => {
    Alert.alert("Completar Reserva", "¿Marcar como completada?", [
      {text: "Cancelar", style: "cancel"},
      {text: "Completar", onPress: async () => { await completeReservation(id).catch(() => {}); setTimeTab("history"); }},
    ]);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const parseDateTime = (dateStr: string, timeStr?: string): Date => {
    const d = parseISODateAsLocal(dateStr);
    const [h, m] = (timeStr || "").slice(0, 5).split(":").map(Number);
    if (Number.isFinite(h)) d.setHours(h, m || 0, 0, 0); else d.setHours(0, 0, 0, 0);
    return d;
  };
  const isPast = (r: any) => {
    const s = String(r.status || "").toUpperCase();
    if (s === "COMPLETED" || s === "FINISHED") return true;
    const t = r.end_time ? parseDateTime(r.date, r.end_time) : parseDateTime(r.date, r.time);
    return t.getTime() < Date.now();
  };

  const filtered = useMemo(() => {
    const todayISO   = toLocalISO(new Date());
    const weekBounds = dateRange === "week"  ? getWeekBounds()  : null;
    const monBounds  = dateRange === "month" ? getMonthBounds() : null;
    return reservations.filter((r: any) => {
      const past = isPast(r);
      if (timeTab === "upcoming" && past)  return false;
      if (timeTab === "history"  && !past) return false;
      if (dateRange === "today"  && r.date !== todayISO)                                      return false;
      if (weekBounds && (r.date < weekBounds.start || r.date > weekBounds.end))               return false;
      if (monBounds  && (r.date < monBounds.start  || r.date > monBounds.end))                return false;
      if (dateRange === "custom" && r.date !== customDate)                                     return false;
      if (statusFilter !== "all") {
        const s = String(r.status || "").toUpperCase();
        if (s !== statusFilter) return false;
      }
      return true;
    }).sort((a: any, b: any) => {
      const aT = parseDateTime(a.date, a.time).getTime();
      const bT = parseDateTime(b.date, b.time).getTime();
      return timeTab === "upcoming" ? aT - bT : bT - aT;
    });
  }, [reservations, timeTab, dateRange, customDate, statusFilter]);

  // ── States ────────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[s.hint, {color: colors.mutedForeground}]}>Cargando reservas…</Text>
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <Ionicons name="alert-circle-outline" size={52} color={colors.error} />
      <Text style={[s.emptyTitle, {color: colors.foreground}]}>Error al cargar</Text>
      <Text style={[s.hint, {color: colors.mutedForeground}]}>{error}</Text>
      <TouchableOpacity style={[s.retryBtn, {backgroundColor: colors.primary}]} onPress={refresh}>
        <Text style={s.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>

      {/* ── Tab switcher ──────────────────────────────────────────────────── */}
      <TabSwitcher value={timeTab} onChange={handleSetTimeTab} colors={colors} />

      {/* ── Filter dropdowns ──────────────────────────────────────────────── */}
      <View style={[s.filterRow, {borderBottomColor: colors.border}]}>
        <FilterDropdown<DateRange>
          label="Período"
          value={dateRange}
          displayValue={dateDisplayValue}
          options={DATE_OPTIONS}
          onChange={handleDateChange}
          colors={colors}
        />
        <FilterDropdown<StatusKey>
          label="Estado"
          value={statusFilter}
          displayValue={statusDisplayValue}
          options={statusOptions}
          onChange={setStatusFilter}
          colors={colors}
        />
      </View>

      {/* ── Place team filter ─────────────────────────────────────────────── */}
      {isPlace && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0}}
          contentContainerStyle={s.teamRow}>
          {[{id: "all" as const, name: "Todos", image: null}, ...teamLinks.map(l => ({
            id: l.professional_id, name: String(l.professional_name || "Pro").split(" ")[0], image: l.user_image,
          }))].map((item) => {
            const sel = teamFilterId === item.id;
            return (
              <TouchableOpacity key={String(item.id)} style={s.teamItem} onPress={() => setTeamFilterId(item.id as any)} activeOpacity={0.8}>
                <View style={[s.teamRing, {borderColor: sel ? colors.primary : colors.border}]}>
                  <View style={[s.teamAvatar, {backgroundColor: colors.card}]}>
                    {item.image
                      ? <Image source={{uri: item.image}} style={s.teamAvatarImg} />
                      : item.id === "all"
                      ? <Ionicons name="people-outline" size={17} color={sel ? colors.primary : colors.mutedForeground} />
                      : <Text style={[s.teamInitial, {color: colors.foreground}]}>{item.name.charAt(0).toUpperCase()}</Text>
                    }
                  </View>
                </View>
                <Text style={[s.teamName, {color: sel ? colors.primary : colors.mutedForeground}]} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Reservation list ──────────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.list, filtered.length === 0 && s.listEmpty]}
        onRefresh={refresh}
        refreshing={false}
        renderItem={({item}) => (
          <ReservationCard
            reservation={item}
            showActions={isProvider}
            onConfirm={isProvider ? handleConfirm : undefined}
            onReject={isProvider ? handleReject : undefined}
            onCancel={(isClient || isProvider) ? handleCancel : undefined}
            onComplete={isProvider && timeTab === "history" ? handleComplete : undefined}
            onPress={() => router.push(`/reservation/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name={timeTab === "upcoming" ? "calendar-outline" : "time-outline"} size={48} color={colors.mutedForeground} />
            <Text style={[s.emptyTitle, {color: colors.foreground}]}>
              {dateRange !== "all" || statusFilter !== "all"
                ? "Sin resultados"
                : timeTab === "upcoming" ? "Sin reservas próximas" : "Sin historial"}
            </Text>
            <Text style={[s.hint, {color: colors.mutedForeground, textAlign: "center"}]}>
              {dateRange !== "all" || statusFilter !== "all"
                ? "Prueba cambiando los filtros."
                : timeTab === "upcoming"
                ? isClient ? "Explora profesionales y agenda tu primera cita." : "Cuando recibas reservas aparecerán aquí."
                : "Tus reservas pasadas aparecerán aquí."}
            </Text>
          </View>
        }
      />

      {/* ── Custom date picker modal ───────────────────────────────────────── */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}>
        <View style={[s.pickerRoot, {backgroundColor: colors.contentBackground}]}>
          <View style={s.pickerHandleWrap}>
            <View style={[s.pickerHandle, {backgroundColor: colors.border}]} />
          </View>
          <View style={[s.pickerHeader, {borderBottomColor: colors.border}]}>
            <Text style={[s.pickerTitle, {color: colors.foreground}]}>Elegir fecha</Text>
            <View style={s.pickerHeaderRight}>
              {customDate && (
                <TouchableOpacity onPress={() => { setDateRange("all"); setCustomDate(null); setShowPicker(false); }} activeOpacity={0.7}>
                  <Text style={[s.pickerClear, {color: colors.primary}]}>Limpiar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.pickerCloseBtn, {backgroundColor: colors.muted}]}
                onPress={() => setShowPicker(false)}
                activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 24)}}>
            <MonthPicker
              reservations={reservations}
              onDayPress={handleCustomDateSelect}
              selectedDate={customDate ?? undefined}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   {flex: 1},
  center: {flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32},

  // Filter row
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Team filter
  teamRow:      {flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 14},
  teamItem:     {alignItems: "center", width: 52},
  teamRing:     {padding: 2, borderRadius: 999, borderWidth: 1.5, marginBottom: 4},
  teamAvatar:   {width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", overflow: "hidden"},
  teamAvatarImg:{width: "100%", height: "100%", borderRadius: 20},
  teamInitial:  {fontSize: 15, fontWeight: "700"},
  teamName:     {fontSize: 11, fontWeight: "600", textAlign: "center"},

  // List
  list:      {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12},
  listEmpty: {flex: 1},

  // Empty / error
  empty:      {flex: 1, justifyContent: "center", alignItems: "center", gap: 10, paddingHorizontal: 32, paddingVertical: 48},
  emptyTitle: {fontSize: 17, fontWeight: "700", textAlign: "center"},
  hint:       {fontSize: 13, lineHeight: 19},
  retryBtn:   {paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, marginTop: 4},
  retryText:  {color: "#fff", fontSize: 14, fontWeight: "600"},

  // Date picker modal
  pickerRoot:       {flex: 1},
  pickerHandleWrap: {alignItems: "center", paddingTop: 10, paddingBottom: 4},
  pickerHandle:     {width: 36, height: 4, borderRadius: 2},
  pickerHeader:     {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerHeaderRight: {flexDirection: "row", alignItems: "center", gap: 12},
  pickerTitle:       {fontSize: 17, fontWeight: "700"},
  pickerClear:       {fontSize: 14, fontWeight: "600"},
  pickerCloseBtn:    {width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center"},
});
