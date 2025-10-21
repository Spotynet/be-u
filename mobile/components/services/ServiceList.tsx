import React from "react";
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {UserService} from "@/types/global";
import {Ionicons} from "@expo/vector-icons";

interface ServiceListProps {
  services: UserService[];
  onEdit?: (service: UserService) => void;
  onDelete?: (service: UserService) => void;
  onToggleStatus?: (service: UserService) => void;
  isLoading?: boolean;
}

export const ServiceList = ({
  services,
  onEdit,
  onDelete,
  onToggleStatus,
  isLoading,
}: ServiceListProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const renderServiceItem = ({item}: {item: UserService}) => {
    const isProfessionalService = item.type === "professional_service";

    return (
      <View style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconContainer, {backgroundColor: colors.primary + "15"}]}>
              <Ionicons name="cut" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>{item.name}</Text>
              <View style={[styles.categoryBadge, {backgroundColor: colors.muted}]}>
                <Text style={[styles.categoryText, {color: colors.mutedForeground}]}>
                  {item.category}
                </Text>
              </View>
            </View>
          </View>

          {onToggleStatus && (
            <TouchableOpacity
              style={[
                styles.statusToggle,
                {backgroundColor: item.is_active ? "#10b981" : colors.muted},
              ]}
              onPress={() => onToggleStatus(item)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.toggleKnob,
                  {
                    backgroundColor: "#ffffff",
                    transform: [{translateX: item.is_active ? 18 : 0}],
                  },
                ]}
              />
            </TouchableOpacity>
          )}
        </View>

        {item.description && (
          <Text style={[styles.description, {color: colors.mutedForeground}]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.detailText, {color: colors.foreground}]}>{item.duration} min</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={[styles.priceText, {color: colors.primary}]}>${item.price}</Text>
          </View>

          {!isProfessionalService && (item as any).professional_assigned && (
            <View style={styles.detailItem}>
              <Ionicons name="person" size={16} color={colors.mutedForeground} />
              <Text style={[styles.detailText, {color: colors.foreground}]} numberOfLines={1}>
                {(item as any).professional_assigned}
              </Text>
            </View>
          )}
        </View>

        {(onEdit || onDelete) && (
          <View style={[styles.actions, {borderTopColor: colors.border}]}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: colors.primary + "10"}]}
                onPress={() => onEdit(item)}
                activeOpacity={0.7}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionText, {color: colors.primary}]}>Editar</Text>
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, {backgroundColor: "#ef4444" + "10"}]}
                onPress={() => onDelete(item)}
                activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionText, {color: "#ef4444"}]}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (services.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="briefcase-outline" size={64} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay servicios</Text>
        <Text style={[styles.emptyText, {color: colors.mutedForeground}]}>
          Comienza agregando tus servicios para que los clientes puedan reservar
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={services}
      renderItem={renderServiceItem}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 6,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "700",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});














