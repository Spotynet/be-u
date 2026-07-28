import {View, StyleSheet} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useAuth} from "@/features/auth";
import {EnhancedReservationsTab} from "@/components/profile/EnhancedReservationsTab";
import React from "react";
import {AppHeader} from "@/components/ui/AppHeader";
import {Redirect} from "expo-router";

export default function Calendario() {
  const {colors} = useThemeVariant();
  const {user, isAuthenticated} = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    tabsContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
  });



  if (!isAuthenticated || !user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Calendario"
        showBackButton={false}
      />
      <View style={[styles.tabsContainer, {backgroundColor: colors.contentBackground}]}>
        <EnhancedReservationsTab
          userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"}
        />
      </View>
    </View>
  );
}

