import {Tabs} from "expo-router";
import React from "react";
import {View, StyleSheet, Image} from "react-native";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

const TAB_ICON_SIZE = 26;

function TabIcon({
  name,
  color,
  focused,
  colors,
}: {
  name: string;
  color: string;
  focused: boolean;
  colors: Record<string, string>;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && {backgroundColor: colors.primary + "22"}]}>
      <Ionicons name={name as any} color={color} size={TAB_ICON_SIZE} />
    </View>
  );
}

export default function TabLayout() {
  const {colors} = useThemeVariant();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="home-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explorar",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="search-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="be-u"
        options={{
          href: null,
          title: "",
          tabBarIcon: () => (
            <View
              style={[
                styles.centerButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}>
              <Image
                source={require("@/assets/images/BE-U-white.png")}
                style={styles.centerButtonIcon}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          href: null,
          title: "Notificaciones",
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="calendar-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, focused}) => (
            <TabIcon name="person-outline" color={color} focused={focused} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30, // Elevates the button above other icons
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  centerButtonIcon: {
    width: 32,
    height: 32,
  },
});
