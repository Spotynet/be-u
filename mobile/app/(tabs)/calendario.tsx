import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useAuth} from "@/features/auth";
import {EnhancedReservationsTab} from "@/components/profile/EnhancedReservationsTab";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import {parseISODateAsLocal, formatDateToYYYYMMDD} from "@/lib/dateUtils";

export default function Calendario() {
  const {colors, colorMode} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const {user, isAuthenticated} = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [iosPickerDate, setIosPickerDate] = useState<Date>(() => new Date());


  const openDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: selectedDate ? parseISODateAsLocal(selectedDate) : new Date(),
        display: "calendar",
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            setSelectedDate(formatDateToYYYYMMDD(date));
          }
        },
      });
    } else if (Platform.OS === "ios") {
      setIosPickerDate(
        selectedDate ? parseISODateAsLocal(selectedDate) : new Date()
      );
      setShowDatePicker(true);
    } else if (Platform.OS === "web") {
      // Web: use native HTML5 date input - this opens the browser's native date picker
      // Ensure we never show the modal on web
      setShowDatePicker(false);
      
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        // Create a temporary input element
        const input = document.createElement("input");
        input.type = "date";
        input.value = selectedDate || "";
        
        // Make it invisible but still functional
        input.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          width: 1px;
          height: 1px;
          pointer-events: auto;
          z-index: 9999;
        `;
        
        document.body.appendChild(input);
        
        const handleChange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.value) {
            setSelectedDate(target.value);
          }
          cleanup();
        };
        
        const handleCancel = () => {
          cleanup();
        };
        
        const cleanup = () => {
          try {
            input.removeEventListener("change", handleChange);
            input.removeEventListener("cancel", handleCancel);
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        };
        
        input.addEventListener("change", handleChange);
        input.addEventListener("cancel", handleCancel);
        
        // Use showPicker() if available (modern browsers), otherwise use click()
        setTimeout(() => {
          if (typeof (input as any).showPicker === "function") {
            (input as any).showPicker().catch(() => {
              // Fallback if showPicker fails
              input.focus();
              input.click();
            });
          } else {
            // Fallback for older browsers
            input.focus();
            input.click();
          }
        }, 0);
      }
    }
  };

  const confirmIosDate = () => {
    setShowDatePicker(false);
    setSelectedDate(formatDateToYYYYMMDD(iosPickerDate));
  };

  const dismissIosDatePicker = () => {
    setShowDatePicker(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
              paddingTop: Math.max(insets.top + 8, 16),
            },
          ]}>
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>Calendario</Text>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="calendar-outline" size={80} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>
            Inicia sesión para ver tus reservas
          </Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            Accede a tu cuenta para gestionar tus reservas y favoritos
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top + 8, 16),
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, {color: colors.foreground}]}>
            Calendario
          </Text>
          <TouchableOpacity
            onPress={openDatePicker}
            activeOpacity={0.7}
            style={styles.headerIconButton}
            accessibilityLabel="Seleccionar fecha"
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {Platform.OS === "ios" && showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={dismissIosDatePicker}
        >
          <View style={styles.datePickerModal}>
            <TouchableOpacity
              style={styles.datePickerBackdrop}
              activeOpacity={1}
              onPress={dismissIosDatePicker}
            />
            <View style={[styles.datePickerSheet, {backgroundColor: colors.card}]}>
              <View
                style={[
                  styles.datePickerHeader,
                  {borderBottomColor: colors.border},
                ]}
              >
                <TouchableOpacity
                  onPress={dismissIosDatePicker}
                  style={styles.datePickerButton}
                >
                  <Text style={[styles.datePickerButtonText, {color: colors.mutedForeground}]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, {color: colors.foreground}]}>
                  Seleccionar fecha
                </Text>
                <TouchableOpacity
                  onPress={confirmIosDate}
                  style={[styles.datePickerButton, styles.datePickerButtonRight]}
                >
                  <Text style={[styles.datePickerButtonText, {color: colors.primary}]}>
                    Listo
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.datePickerContent, {backgroundColor: colors.card}]}>
                <DateTimePicker
                  mode="date"
                  value={iosPickerDate}
                  display="spinner"
                  onChange={(_event, date) => date && setIosPickerDate(date)}
                  style={styles.datePicker}
                  textColor={colors.foreground}
                  themeVariant={colorMode}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}


      <View style={styles.tabsContainer}>
        <EnhancedReservationsTab
          userRole={user.role as "CLIENT" | "PROFESSIONAL" | "PLACE"}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  headerIconButton: {
    padding: 4,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerModal: {
    flex: 1,
    flexDirection: "column",
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  datePickerSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    minHeight: 350,
    maxHeight: 500,
  },
  datePickerContent: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  datePicker: {
    width: "100%",
    height: 200,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  datePickerButton: {
    padding: 8,
    minWidth: 80,
  },
  datePickerButtonRight: {
    alignItems: "flex-end",
  },
  datePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  tabsContainer: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
});
