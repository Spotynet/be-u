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
import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";

export default function Calendario() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [showMonthView, setShowMonthView] = useState(false);

  const toggleMonthView = () => {
    setShowMonthView((v) => !v);
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
            onPress={toggleMonthView}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            accessibilityLabel={showMonthView ? "Ver semana" : "Ver mes completo"}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={showMonthView ? colors.primary : colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <EnhancedReservationsTab
          userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          showMonthView={showMonthView}
          onCloseMonthView={() => setShowMonthView(false)}
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
