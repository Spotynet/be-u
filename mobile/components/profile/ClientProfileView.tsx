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
          {/* Avatar with Elegant Ring */}
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarRing, {borderColor: colors.primary + "30"}]}>
              {profile?.photo ? (
                <Image source={{uri: profile.photo}} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, styles.avatarPlaceholder, {backgroundColor: "#3b82f6"}]}>
                  <Text style={styles.avatarText}>
                    {getInitials(user?.first_name, user?.last_name)}
                  </Text>
                </View>
              )}
            </View>
            {/* Premium Badge */}
            <View style={[styles.premiumBadge, {backgroundColor: "#fbbf24"}]}>
              <Ionicons name="star" color="#ffffff" size={14} />
            </View>
          </View>

          {/* User Info */}
          <Text style={[styles.profileName, {color: colors.foreground}]}>
            {user?.first_name || user?.firstName || "Usuario"}{" "}
            {user?.last_name || user?.lastName || ""}
          </Text>

          <View style={styles.contactInfo}>
            <View style={[styles.infoChip, {backgroundColor: colors.card}]}>
              <Ionicons name="mail" color={colors.primary} size={14} />
              <Text style={[styles.infoChipText, {color: colors.foreground}]} numberOfLines={1}>
                {user?.email || "No email"}
              </Text>
            </View>
            {profile?.phone && (
              <View style={[styles.infoChip, {backgroundColor: colors.card}]}>
                <Ionicons name="call" color={colors.primary} size={14} />
                <Text style={[styles.infoChipText, {color: colors.foreground}]}>
                  {profile.phone}
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.memberBadge, {backgroundColor: colors.primary + "15"}]}>
            <Ionicons name="shield-checkmark" color={colors.primary} size={14} />
            <Text style={[styles.memberText, {color: colors.primary}]}>
              Miembro desde{" "}
              {user?.date_joined
                ? new Date(user.date_joined).toLocaleDateString("es-MX", {
                    month: "short",
                    year: "numeric",
                  })
                : "Fecha no disponible"}
            </Text>
          </View>
        </View>
      </View>

      {/* Premium Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Reservas Card */}
        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.card}]}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/reservas")}>
          <View style={[styles.statIconContainer, {backgroundColor: "#3b82f6"}]}>
            <Ionicons name="calendar" color="#ffffff" size={20} />
          </View>
          <Text style={[styles.statNumber, {color: colors.foreground}]}>
            {stats.reservations || 0}
          </Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Reservas</Text>
          <View style={styles.statIndicator}>
            <Ionicons name="arrow-forward" color={colors.primary} size={12} />
          </View>
        </TouchableOpacity>

        {/* Reviews Card */}
        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.card}]}
          activeOpacity={0.7}>
          <View style={[styles.statIconContainer, {backgroundColor: "#fbbf24"}]}>
            <Ionicons name="star" color="#ffffff" size={20} />
          </View>
          <Text style={[styles.statNumber, {color: colors.foreground}]}>{stats.reviews || 0}</Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Reviews</Text>
          <View style={styles.statIndicator}>
            <Ionicons name="arrow-forward" color={colors.primary} size={12} />
          </View>
        </TouchableOpacity>

        {/* Favoritos Card */}
        <TouchableOpacity
          style={[styles.statCard, {backgroundColor: colors.card}]}
          activeOpacity={0.7}>
          <View style={[styles.statIconContainer, {backgroundColor: "#ef4444"}]}>
            <Ionicons name="heart" color="#ffffff" size={20} />
          </View>
          <Text style={[styles.statNumber, {color: colors.foreground}]}>
            {stats.favorites || 0}
          </Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Favoritos</Text>
          <View style={styles.statIndicator}>
            <Ionicons name="arrow-forward" color={colors.primary} size={12} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Additional spacing at bottom */}
      <View style={{height: 20}} />

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
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  avatarRing: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 3,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 1,
  },
  premiumBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
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
  profileName: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  contactInfo: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    maxWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  memberText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statIndicator: {
    marginTop: 4,
    opacity: 0.6,
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
