import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useNavigation} from "@react-navigation/native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {EnhancedReservationsTab} from "@/components/profile/EnhancedReservationsTab";
import {Ionicons} from "@expo/vector-icons";
import React, {useState} from "react";
import {AppHeader, APP_HEADER_ICON_SIZE, APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";
import {Redirect} from "expo-router";

import {useAppTheme} from "@/constants/theme";

export default function Calendario() {
  const {colors} = useThemeVariant();
  const theme = useAppTheme();
  const {user, isAuthenticated} = useAuth();
  const insets = useSafeAreaInsets();
  const {goBack} = useNavigation();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [showMonthView, setShowMonthView] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    headerIconButton: {
      width: APP_HEADER_ICON_SIZE,
      height: APP_HEADER_ICON_SIZE,
      justifyContent: "center",
      alignItems: "center",
    },
    tabsContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
  });



  const toggleMonthView = () => {
    setShowMonthView((v) => !v);
  };

  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Calendario"
        showBackButton={false}
        rightExtra={
          <TouchableOpacity
            onPress={toggleMonthView}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            accessibilityLabel={showMonthView ? "Ver semana" : "Ver mes completo"}>
            <Ionicons name="calendar-outline" size={APP_HEADER_ICON_SIZE} color={theme.white} />
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

