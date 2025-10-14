import {View, Text, TouchableOpacity, StyleSheet, Animated} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useState, useRef, useEffect} from "react";
import {Ionicons} from "@expo/vector-icons";
import {EnhancedReservationsTab} from "./EnhancedReservationsTab";
import {ReviewsTab} from "./ReviewsTab";
import {FavoritesTab} from "./FavoritesTab";

type TabName = "reservations" | "reviews" | "favorites";

interface ProfileTabsProps {
  userRole: "CLIENT" | "PROFESSIONAL" | "PLACE";
}

export function ProfileTabs({userRole}: ProfileTabsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [activeTab, setActiveTab] = useState<TabName>("reservations");
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs: {key: TabName; label: string; icon: string}[] = [
    {key: "reservations", label: "Reservas", icon: "calendar-outline"},
    {key: "reviews", label: "Reseñas", icon: "star-outline"},
    {key: "favorites", label: "Guardados", icon: "heart-outline"},
  ];

  useEffect(() => {
    const tabIndex = tabs.findIndex((tab) => tab.key === activeTab);
    Animated.spring(slideAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [activeTab, slideAnim]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "reservations":
        return <EnhancedReservationsTab userRole={userRole} />;
      case "reviews":
        return <ReviewsTab userRole={userRole} />;
      case "favorites":
        return <FavoritesTab />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Tab Headers */}
      <View style={[styles.tabsHeader, {borderBottomColor: colors.border}]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}>
            <Ionicons
              name={activeTab === tab.key ? tab.icon.replace("-outline", "") : tab.icon}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
              size={24}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key
                  ? {color: colors.primary, fontWeight: "700"}
                  : {color: colors.mutedForeground, fontWeight: "600"},
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.primary,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, "33.33%", "66.66%"],
                  }),
                },
              ],
              width: `${100 / tabs.length}%`,
            },
          ]}
        />
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    borderRadius: 3,
  },
  tabContent: {
    flex: 1,
  },
});
