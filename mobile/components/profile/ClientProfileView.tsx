import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {User, ClientProfile} from "@/types/global";
import {useRouter} from "expo-router";
import {ProfileTabs} from "./ProfileTabs";

interface ClientProfileViewProps {
  user: User;
  profile: ClientProfile | null;
  stats: {
    reservations?: number;
    reviews?: number;
    favorites?: number;
  };
}

export const ClientProfileView = ({user, profile, stats}: ClientProfileViewProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const isDark = colorScheme === "dark";

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Header with Background */}
      <View style={[styles.headerGradient, {backgroundColor: isDark ? "#0a0a0a" : "#f8fafc"}]}>
        <View style={styles.profileHeader}>
          <View style={styles.horizontalLayout}>
            {/* Modern Avatar with Gradient Ring */}
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarContainer, {backgroundColor: colors.card}]}>
                {profile?.photo ? (
                  <Image source={{uri: profile.photo}} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      styles.avatarPlaceholder,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Text style={styles.avatarText}>
                      {getInitials(user?.first_name, user?.last_name)}
                    </Text>
                  </View>
                )}
                {/* Status indicator ring */}
                <View style={[styles.statusRing, {borderColor: colors.primary}]} />
              </View>
              {/* Premium Badge */}
              <View style={[styles.premiumBadge, {backgroundColor: "#fbbf24"}]}>
                <Ionicons name="star" color="#ffffff" size={16} />
              </View>
            </View>

            {/* Simplified User Info */}
            <View style={styles.userInfoContainer}>
              <Text style={[styles.profileName, {color: colors.foreground}]}>
                {user?.first_name || user?.firstName || "Usuario"}{" "}
                {user?.last_name || user?.lastName || ""}
              </Text>

              <Text style={[styles.userEmail, {color: colors.mutedForeground}]} numberOfLines={1}>
                {user?.email || "No email"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Profile Tabs */}
      <View style={{minHeight: 400}}>
        <ProfileTabs userRole="CLIENT" />
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 40,
  },
  profileHeader: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  horizontalLayout: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 1,
  },
  statusRing: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 52,
    borderWidth: 3,
    opacity: 0.3,
  },
  premiumBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  actionsGrid: {
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
