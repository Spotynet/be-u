import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {Tabs} from "expo-router";
import React, {useRef, useEffect} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useNotifications} from "@/features/notifications/hooks/useNotifications";
import type {BottomTabBarProps} from "@react-navigation/bottom-tabs";

const VISIBLE_TABS = ["index", "calendario", "notificaciones", "perfil"];

const TAB_META: Record<string, {icon: string; iconFilled: string; label: string}> = {
  index:          {icon: "home-outline",          iconFilled: "home",          label: "Inicio"},
  calendario:     {icon: "calendar-outline",      iconFilled: "calendar",      label: "Calendario"},
  notificaciones: {icon: "bell-outline",          iconFilled: "bell",          label: "Notifs"},
  perfil:         {icon: "account-outline",       iconFilled: "account",       label: "Perfil"},
};

function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
  unreadCount,
  accentColor,
  inactiveColor,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  unreadCount: number;
  accentColor: string;
  inactiveColor: string;
}) {
  const meta = TAB_META[route.name];
  const chipAnim  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const iconAnim  = useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(chipAnim, {toValue: isFocused ? 1 : 0, useNativeDriver: true, friction: 10, tension: 140}),
      Animated.spring(iconAnim, {toValue: isFocused ? 1.1 : 1,  useNativeDriver: true, friction: 8,  tension: 130}),
    ]).start();
  }, [isFocused]);

  const chipScale   = chipAnim.interpolate({inputRange: [0, 1], outputRange: [0.6, 1]});
  const chipOpacity = chipAnim.interpolate({inputRange: [0, 1], outputRange: [0, 1]});
  const showBadge   = route.name === "notificaciones" && unreadCount > 0;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.85}>

      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: accentColor + "1E",
            borderColor: accentColor + "30",
            opacity: chipOpacity,
            transform: [{scale: chipScale}],
          },
        ]}
      />

      <Animated.View style={{transform: [{scale: iconAnim}]}}>
        <MaterialCommunityIcons
          name={(isFocused ? meta.iconFilled : meta.icon) as any}
          size={22}
          color={isFocused ? accentColor : inactiveColor}
        />
      </Animated.View>

      {showBadge && (
        <View style={[styles.notifDot, {backgroundColor: accentColor}]} />
      )}
    </TouchableOpacity>
  );
}

function FloatingTabBar({state, navigation}: BottomTabBarProps) {
  const {colors} = useThemeVariant();
  const {unreadCount} = useNotifications();

  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.includes(r.name));
  const accentColor   = colors.accent;
  const inactiveColor = "rgba(255,255,255,0.42)";

  return (
    <View style={styles.outerWrap}>
      <View style={[styles.pill, {backgroundColor: colors.navBarBg, borderColor: "rgba(255,255,255,0.07)"}]}>
        {visibleRoutes.map((route) => {
          const globalIdx = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === globalIdx;

          const onPress = () => {
            const event = navigation.emit({type: "tabPress", target: route.key, canPreventDefault: true});
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={() => navigation.emit({type: "tabLongPress", target: route.key})}
              unreadCount={unreadCount}
              accentColor={accentColor}
              inactiveColor={inactiveColor}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore"        options={{href: null}} />
      <Tabs.Screen name="be-u"           options={{href: null}} />
      <Tabs.Screen name="notificaciones" />
      <Tabs.Screen name="calendario" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  pill: {
    flexDirection: "row",
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    ...Platform.select({
      web: {
        // @ts-ignore
        boxShadow: "0 8px 32px rgba(0,0,0,0.32)",
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    minHeight: 56,
    gap: 3,
    position: "relative",
  },
  chip: {
    position: "absolute",
    width: 56,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: "20%",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
