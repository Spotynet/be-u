import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useAuth} from "@/features/auth";
import {EnhancedReservationsTab} from "@/components/profile/EnhancedReservationsTab";
import {CalendarModal} from "@/components/calendar/CalendarModal";
import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";
import {useReservations, useIncomingReservations} from "@/features/reservations";

export default function Calendario() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Fetch reservations for calendar indicators
  // Hooks must be called unconditionally (Rules of Hooks)
  // But we'll only use the data if authenticated
  const clientHook = useReservations(user?.id);
  const providerHook = useIncomingReservations();

  // Determine which reservations to use based on user role
  // Ensure reservations is always an array to prevent undefined errors
  const reservations = React.useMemo(() => {
    if (!isAuthenticated || !user) return [];
    try {
      const res = user.role === "CLIENT" ? clientHook.reservations : providerHook.reservations;
      return Array.isArray(res) ? res : [];
    } catch (error) {
      // If there's any error accessing reservations, return empty array
      console.warn("Error getting reservations for calendar:", error);
      return [];
    }
  }, [isAuthenticated, user?.role, clientHook.reservations, providerHook.reservations]);

  const openCalendarModal = () => {
    setShowCalendarModal(true);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 8, 16),
            },
          ]}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Calendario</Text>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="calendar-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tus reservas
          </Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            Accede a tu cuenta para gestionar tus reservas y favoritos
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Calendario
          </Text>
          <TouchableOpacity
            onPress={openCalendarModal}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            accessibilityLabel="Abrir calendario"
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={handleSelectDate}
        selectedDate={selectedDate}
        reservations={reservations}
      />


      <View style={styles.tabsContainer}>
        <EnhancedReservationsTab
          userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  headerIconButton: {
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
});
