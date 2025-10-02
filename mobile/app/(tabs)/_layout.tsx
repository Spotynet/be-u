import {Tabs} from "expo-router";
import React from "react";
import {Ionicons} from "@expo/vector-icons";

import {HapticTab} from "@/components/haptic-tab";
import {BeUTab} from "@/components/BeUTab";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
          borderTopColor: Colors[colorScheme ?? "light"].border,
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
          title: "BE-U",
          tabBarIcon: ({color, focused}) => <BeUTab focused={focused} onPress={() => {}} />,
          tabBarButton: (props) => (
            <BeUTab focused={props.accessibilityState?.selected || false} onPress={props.onPress} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: "Reservas",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={24} />
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
