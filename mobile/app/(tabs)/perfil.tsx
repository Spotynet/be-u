import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions} from "react-native";
import {useState, useRef, useEffect, useMemo} from "react";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import Settings from "@/app/settings";
import {FavoritesTab} from "@/components/profile/FavoritesTab";
import {ProfileCustomizationTab} from "@/components/profile/ProfileCustomizationTab";
import SettingsMenu from "@/components/profile/SettingsMenu";
import {useAuth} from "@/features/auth";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

type TabKey = "settings" | "favorites" | "publicProfile";

export default function Perfil() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("settings");
  const [isSettingsMenuVisible, setIsSettingsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  const tabs = useMemo(() => {
    const base: {key: TabKey; label: string; icon: string}[] = [
      {key: "settings", label: "Perfil", icon: "person-outline"},
      {key: "favorites", label: "Guardados", icon: "heart-outline"},
    ];
    if (isAuthenticated && isProvider) {
      base.push({key: "publicProfile", label: "Mi página", icon: "create-outline"});
    }
    return base;
  }, [isAuthenticated, isProvider]);

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
      case "settings":
        return <Settings embedded />;
      case "favorites":
        return <FavoritesTab />;
      case "publicProfile":
        return <ProfileCustomizationTab userRole={user?.role as "PROFESSIONAL" | "PLACE"} />;
      default:
        return null;
    }
  };

  const tabCount = tabs.length;
  const indicatorWidth = SCREEN_WIDTH / tabCount;
  const inputRange = tabs.map((_, i) => i);
  const outputRange = tabs.map((_, i) => i * indicatorWidth);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 12, 16),
          },
        ]}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
        <TouchableOpacity
          style={styles.settingsIconButton}
          onPress={() => setIsSettingsMenuVisible(true)}
          activeOpacity={0.7}>
          <View style={[styles.settingsIconContainer, {backgroundColor: colors.card}]}>
            <Ionicons name="settings" color={colors.primary} size={22} />
          </View>
        </TouchableOpacity>
      </View>
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
              size={22}
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
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.primary,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange,
                    outputRange,
                  }),
                },
              ],
              width: indicatorWidth,
            },
          ]}
        />
      </View>
      <View style={styles.tabContent}>{renderTabContent()}</View>
      <SettingsMenu
        visible={isSettingsMenuVisible}
        onClose={() => setIsSettingsMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  settingsIconButton: {
    padding: 4,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
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
