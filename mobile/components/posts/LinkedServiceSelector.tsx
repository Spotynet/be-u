import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {formatPrice} from "@/lib/priceUtils";

export type CustomServiceItem = {
  id: number;
  name: string;
  price: string;
  duration_minutes?: number;
};

type Props = {
  customServices: CustomServiceItem[];
  linkedServiceId: number | null;
  onSelect: (id: number | null) => void;
  colors: Record<string, string>;
  styles?: { section?: object; sectionTitle?: object; optionalBadge?: object; linkedServiceOption?: object; linkedServiceOptionSelected?: object; linkedServiceName?: object; linkedServiceMeta?: object };
};

export function LinkedServiceSelector({
  customServices,
  linkedServiceId,
  onSelect,
  colors,
  styles: customStyles = {},
}: Props) {
  if (customServices.length === 0) return null;

  return (
    <View style={[defaultStyles.section, { backgroundColor: colors.card }, customStyles.section]}>
      <Text style={[defaultStyles.sectionTitle, { color: colors.foreground }, customStyles.sectionTitle]}>
        Vincular un servicio
      </Text>
      <Text style={[defaultStyles.optionalBadge, { color: colors.mutedForeground }, customStyles.optionalBadge]}>
        Opcional. Quien reserve desde esta publicación irá directo a este servicio.
      </Text>
      <TouchableOpacity
        style={[
          defaultStyles.linkedServiceOption,
          { borderColor: colors.border, backgroundColor: colors.inputBackground },
          linkedServiceId === null && defaultStyles.linkedServiceOptionSelected,
          customStyles.linkedServiceOption,
          linkedServiceId === null && customStyles.linkedServiceOptionSelected,
        ]}
        onPress={() => onSelect(null)}>
        <Text style={[defaultStyles.linkedServiceName, { color: colors.foreground }, customStyles.linkedServiceName]}>
          Ninguno
        </Text>
      </TouchableOpacity>
      {customServices.map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[
            defaultStyles.linkedServiceOption,
            { borderColor: colors.border, backgroundColor: colors.inputBackground },
            linkedServiceId === s.id && defaultStyles.linkedServiceOptionSelected,
            customStyles.linkedServiceOption,
            linkedServiceId === s.id && customStyles.linkedServiceOptionSelected,
          ]}
          onPress={() => onSelect(s.id)}>
          <Text style={[defaultStyles.linkedServiceName, { color: colors.foreground }, customStyles.linkedServiceName]}>
            {s.name}
          </Text>
          <Text style={[defaultStyles.linkedServiceMeta, { color: colors.mutedForeground }, customStyles.linkedServiceMeta]}>
            {formatPrice(s.price, {suffix: " MXN"})} · {s.duration_minutes ?? 60} min
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const defaultStyles = StyleSheet.create({
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  optionalBadge: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 12,
  },
  linkedServiceOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  linkedServiceOptionSelected: {
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
  linkedServiceName: {
    fontSize: 15,
    fontWeight: "600",
  },
  linkedServiceMeta: {
    fontSize: 13,
    marginTop: 4,
  },
});
