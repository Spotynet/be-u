import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {Tabs} from "expo-router";
import React from "react";

import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function TabLayout() {
  const {colors} = useThemeVariant();
  const inactiveTint = colors.tabIconDefault ?? colors.mutedForeground;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {backgroundColor: colors.card},
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: "Explorar",
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="be-u"
        options={{
          href: null,
          title: "",
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          href: null,
          title: "Notificaciones",
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="bell-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: "Calendario",
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="calendar-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
