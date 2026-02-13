import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {EnhancedReservationsTab} from "@/components/profile/EnhancedReservationsTab";
import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";
import {AppHeader, APP_HEADER_ICON_SIZE, APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";

export default function Calendario() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [showMonthView, setShowMonthView] = useState(false);

  const toggleMonthView = () => {
    setShowMonthView((v) => !v);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Calendario"
          showBackButton={false}
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
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
      <AppHeader
        title="Calendario"
        showBackButton={false}
        backgroundColor={colors.background}
        borderBottom={colors.border}
        rightExtra={
          <TouchableOpacity
            onPress={toggleMonthView}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            accessibilityLabel={showMonthView ? "Ver semana" : "Ver mes completo"}>
            <Ionicons name="calendar-outline" size={APP_HEADER_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <View style={[styles.tabsContainer, {backgroundColor: colors.contentBackground}]}>
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
  headerIconButton: {
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
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
