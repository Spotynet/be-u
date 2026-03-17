import {useEffect, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {formatPrice} from "@/lib/priceUtils";

export type CustomServiceItem = {
  id: number;
  name: string;
  price: string;
  duration_minutes?: number;
  /** Main category stored on CustomService (belleza | bienestar | mascotas | otros) */
  category?: string;
};

/** Maps each subcategory id → its parent main category */
const SUB_TO_MAIN: Record<string, string> = {
  // belleza
  cabello: "belleza",
  barberia: "belleza",
  // bienestar
  spa_relajacion: "bienestar",
  yoga: "bienestar",
  meditacion: "bienestar",
  nutricion_alimentacion: "bienestar",
  fisioterapia: "bienestar",
  entrenamiento: "bienestar",
  psicologia: "bienestar",
  terapias_alternativas: "bienestar",
  // mascotas
  estetica_mascotas: "mascotas",
  spa_mascotas: "mascotas",
  cuidadores: "mascotas",
  paseadores: "mascotas",
};

type Props = {
  customServices: CustomServiceItem[];
  linkedServiceId: number | null;
  onSelect: (id: number | null) => void;
  colors: Record<string, string>;
  /** When set, only show services whose category matches the parent main category */
  subcategoryFilter?: string | null;
};

export function LinkedServiceSelector({
  customServices,
  linkedServiceId,
  onSelect,
  colors,
  subcategoryFilter,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  // Determine the main category required by the current subcategory filter
  const requiredMainCategory = subcategoryFilter
    ? (SUB_TO_MAIN[subcategoryFilter.toLowerCase()] ?? null)
    : null;

  // Filter services to those matching the main category (or all if no filter)
  const filteredServices = requiredMainCategory
    ? customServices.filter(
        (s) =>
          !s.category ||
          s.category.toLowerCase() === requiredMainCategory.toLowerCase()
      )
    : customServices;

  // Auto-clear selection when the selected service no longer appears in the filtered list
  useEffect(() => {
    if (
      linkedServiceId != null &&
      filteredServices.length > 0 &&
      !filteredServices.find((s) => s.id === linkedServiceId)
    ) {
      onSelect(null);
    }
  }, [subcategoryFilter]);

  if (filteredServices.length === 0) return null;

  const selectedService = linkedServiceId != null
    ? filteredServices.find((s) => s.id === linkedServiceId)
    : null;

  const openPicker = () => setModalVisible(true);
  const closePicker = () => setModalVisible(false);
  const handleSelect = (id: number | null) => {
    onSelect(id);
    closePicker();
  };

  return (
    <>
      <View style={styles.wrapper}>
        <Text style={[styles.label, {color: colors.foreground}]}>SERVICIO</Text>
        {selectedService ? (
          <View
            style={[
              styles.linkedCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}>
            <View style={styles.linkedCardLeft}>
              <Text style={[styles.linkedName, {color: colors.foreground}]} numberOfLines={1}>
                {selectedService.name}
              </Text>
              <Text style={[styles.linkedPrice, {color: colors.primary}]}>
                {formatPrice(selectedService.price, {suffix: " MXN"})}
              </Text>
            </View>
            <View style={styles.linkedCardActions}>
              <TouchableOpacity
                onPress={openPicker}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="pencil-outline" color={colors.mutedForeground} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSelect(null)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                style={styles.actionBtn}>
                <Ionicons name="close" color={colors.mutedForeground} size={22} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openPicker}
            style={[
              styles.card,
              {
                borderColor: colors.primary + "80",
                backgroundColor: colors.card,
              },
            ]}>
            <View style={styles.emptyContent}>
              <View style={[styles.plusCircle, {backgroundColor: colors.primary}]}>
                <Ionicons name="add" color="#FFFFFF" size={24} />
              </View>
              <Text style={[styles.primaryText, {color: colors.foreground}]}>
                Vincular servicio
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}>
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={[styles.modalContent, {backgroundColor: colors.card}]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>
              Elegir servicio
            </Text>
            <TouchableOpacity
              style={[
                styles.optionRow,
                {borderColor: colors.border, backgroundColor: colors.input},
                linkedServiceId === null && {borderColor: colors.primary, borderWidth: 2},
              ]}
              onPress={() => handleSelect(null)}>
              <Text style={[styles.optionName, {color: colors.foreground}]}>Ninguno</Text>
            </TouchableOpacity>
            {filteredServices.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.optionRow,
                  {borderColor: colors.border, backgroundColor: colors.input},
                  linkedServiceId === s.id && {borderColor: colors.primary, borderWidth: 2},
                ]}
                onPress={() => handleSelect(s.id)}>
                <Text style={[styles.optionName, {color: colors.foreground}]}>{s.name}</Text>
                <Text style={[styles.optionMeta, {color: colors.mutedForeground}]}>
                  {formatPrice(s.price, {suffix: " MXN"})} · {s.duration_minutes ?? 60} min
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cancelButton, {borderColor: colors.border}]}
              onPress={closePicker}>
              <Text style={[styles.cancelButtonText, {color: colors.foreground}]}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  emptyContent: {
    alignItems: "center",
    gap: 10,
  },
  plusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  linkedCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkedCardLeft: {
    flex: 1,
    justifyContent: "center",
    marginRight: 12,
  },
  linkedName: {
    fontSize: 16,
    fontWeight: "700",
  },
  linkedPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  linkedCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
