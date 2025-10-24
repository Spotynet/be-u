import {Tabs} from "expo-router";
import React from "react";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 80, // Increased height to accommodate elevated button
          paddingBottom: 20,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "search" : "search-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="be-u"
        options={{
          title: "Be-U",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{
          title: "Notificaciones",
          tabBarIcon: ({color, focused}) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "person" : "person-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
