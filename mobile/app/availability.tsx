import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useEffect} from "react";
import {useAuth} from "@/features/auth";
import {useAvailability} from "@/features/services";
import {AvailabilityEditor} from "@/components/calendar";
import {WeeklySchedule} from "@/types/global";
import {useNavigation} from "@/hooks/useNavigation";

export default function AvailabilityScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {goBack} = useNavigation();
  const {user, isAuthenticated} = useAuth();

  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";
  const providerType = user?.role === "PROFESSIONAL" ? "professional" : "place";
  const providerId =
    user?.role === "PROFESSIONAL"
      ? (user as any).professional_profile?.id
      : (user as any).place_profile?.id;

  const {
    availability,
    isLoading,
    error,
    fetchAvailability,
    updateAvailability,
    availabilityToSchedule,
  } = useAvailability(providerId, providerType as any);

  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isProvider && providerId) {
      fetchAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isProvider, providerId]);

  useEffect(() => {
    if (!isLoading && availability.length > 0) {
      const weeklySchedule = availabilityToSchedule(availability);
      setSchedule(weeklySchedule);
      setHasChanges(false);
    } else if (!isLoading && availability.length === 0 && providerId) {
      // Default schedule (Monday-Friday, 9AM-6PM) - only set if we've already fetched
      setSchedule({
        0: {enabled: true, start_time: "09:00", end_time: "18:00"},
        1: {enabled: true, start_time: "09:00", end_time: "18:00"},
        2: {enabled: true, start_time: "09:00", end_time: "18:00"},
        3: {enabled: true, start_time: "09:00", end_time: "18:00"},
        4: {enabled: true, start_time: "09:00", end_time: "18:00"},
        5: {enabled: false, start_time: "09:00", end_time: "18:00"},
        6: {enabled: false, start_time: "09:00", end_time: "18:00"},
      });
    }
  }, [availability, isLoading, providerId]);

  const handleScheduleChange = (newSchedule: WeeklySchedule) => {
    setSchedule(newSchedule);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateAvailability(schedule);
      setHasChanges(false);
      // Refresh availability after save
      await fetchAvailability();
    } catch (err) {
      // Error already handled in hook
    }
  };

  // Redirect if not a provider
  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 16, 20),
            },
          ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => goBack("/(tabs)/perfil")}>
            <Ionicons name="arrow-back" color={colors.foreground} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Disponibilidad</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="lock-closed" size={80} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.errorText, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar su disponibilidad
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 16,
          },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBack("/(tabs)/perfil")}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" color={colors.foreground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>
          Gestionar Disponibilidad
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {isLoading && Object.keys(schedule).length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, {color: colors.mutedForeground}]}>
            Cargando disponibilidad...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, {backgroundColor: colors.primary + "10"}]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoText, {color: colors.primary}]}>
              Configura tu horario semanal. Los clientes solo podrán reservar en los horarios que
              marques como disponibles.
            </Text>
          </View>

          <AvailabilityEditor schedule={schedule} onChange={handleScheduleChange} />
        </ScrollView>
      )}

      {/* Save Button */}
      {hasChanges && (
        <View
          style={[
            styles.saveContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}>
          <TouchableOpacity
            style={[styles.saveButton, {backgroundColor: colors.primary}]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.9}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.saveButtonText}>Guardar Horario</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
  saveContainer: {
    padding: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});






































