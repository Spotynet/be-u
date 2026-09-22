import {View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Platform, ActivityIndicator} from "react-native";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useEffect, useState, useCallback, useMemo} from "react";
import {useAuth} from "@/features/auth";
import {useServiceManagement} from "@/features/services";
import {useRouter} from "expo-router";
import {UserService} from "@/types/global";
import {AppHeader, APP_HEADER_BUTTON_HIT} from "@/components/ui/AppHeader";
import {formatPrice} from "@/lib/priceUtils";

type StatusFilter = "all" | "active" | "inactive";

interface FlatItem {
  type: "search" | "tabs" | "count" | "category_header" | "service";
  service?: UserService;
  category?: string;
  count?: number;
}

export default function ServicesScreen() {
  const {colors} = useThemeVariant();
  const router = useRouter();
  const {user, isAuthenticated} = useAuth();
  const {services, isLoading, fetchMyServices, deleteService, toggleServiceStatus} =
    useServiceManagement();
  const isProvider = user?.role === "PROFESSIONAL" || user?.role === "PLACE";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<UserService | null>(null);

  useEffect(() => {
    if (isAuthenticated && isProvider) {
      fetchMyServices();
    }
  }, [isAuthenticated, isProvider]);

  const handleEdit = useCallback(
    (service: UserService) => {
      router.push(`/profile/services/edit/${service.id}` as any);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((service: UserService) => {
    setDeleteTarget(service);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteService(deleteTarget.id, deleteTarget.type);
    } catch {}
    setDeleteTarget(null);
  }, [deleteTarget, deleteService]);

  const handleToggleStatus = useCallback(
    (service: UserService) => {
      toggleServiceStatus(service.id, service.type, service.is_active);
    },
    [toggleServiceStatus]
  );

  const filteredServices = useMemo(() => {
    let result = services;
    if (statusFilter === "active") result = result.filter((s) => s.is_active);
    if (statusFilter === "inactive") result = result.filter((s) => !s.is_active);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [services, statusFilter, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, UserService[]>();
    for (const s of filteredServices) {
      const cat = s.category || "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [filteredServices]);

  const flatData = useMemo(() => {
    const items: FlatItem[] = [];
    if (services.length === 0) return items;

    items.push({type: "search"});
    items.push({type: "tabs"});
    items.push({type: "count", count: filteredServices.length});

    if (filteredServices.length === 0) return items;

    if (groupedByCategory.size > 1) {
      for (const [category, catServices] of groupedByCategory) {
        items.push({type: "category_header", category, count: catServices.length});
        for (const s of catServices) {
          items.push({type: "service", service: s});
        }
      }
    } else {
      for (const s of filteredServices) {
        items.push({type: "service", service: s});
      }
    }
    return items;
  }, [services, filteredServices, groupedByCategory]);

  if (!isAuthenticated || !isProvider) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <AppHeader
          title="Mis Servicios"
          showBackButton
          backFallbackRoute="/(tabs)/perfil"
          backgroundColor={colors.background}
          borderBottom={colors.border}
        />
        <View style={styles.centeredContainer}>
          <View style={[styles.emptyIconWrap, {backgroundColor: colors.muted}]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>Acceso Restringido</Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            Solo profesionales y lugares pueden gestionar servicios
          </Text>
        </View>
      </View>
    );
  }

  const renderCard = (item: UserService) => {
    const isActive = item.is_active;
    return (
      <View key={`${item.type}-${item.id}`} style={[styles.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, {backgroundColor: colors.primary + "12"}]}>
            <Ionicons name="cut" size={18} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, {color: colors.foreground}]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardCategory, {color: colors.mutedForeground}]}>
              {item.category}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.statusPill, {backgroundColor: isActive ? "#10b981" + "18" : colors.muted}]}
            onPress={() => handleToggleStatus(item)}
            activeOpacity={0.7}>
            <View style={[styles.statusDot, {backgroundColor: isActive ? "#10b981" : colors.mutedForeground}]} />
            <Text style={[styles.statusText, {color: isActive ? "#10b981" : colors.mutedForeground}]}>
              {isActive ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        </View>

        {item.description ? (
          <Text style={[styles.cardDescription, {color: colors.mutedForeground}]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={[styles.cardMeta, {borderTopColor: colors.border}]}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, {color: colors.mutedForeground}]}>{item.duration} min</Text>
          </View>
          <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
          <Text style={[styles.metaPrice, {color: colors.primary}]}>
            {formatPrice(item.price, {suffix: " MXN"})}
          </Text>
          {!("professional_service" === item.type) && (item as any).professional_assigned && (
            <>
              <View style={[styles.metaDot, {backgroundColor: colors.mutedForeground}]} />
              <View style={styles.metaItem}>
                <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaText, {color: colors.mutedForeground}]} numberOfLines={1}>
                  {(item as any).professional_assigned}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardActionBtn, {backgroundColor: colors.primary + "10"}]}
            onPress={() => handleEdit(item)}
            activeOpacity={0.7}>
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={[styles.cardActionText, {color: colors.primary}]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardActionBtn, {backgroundColor: "#ef4444" + "10"}]}
            onPress={() => handleDeleteRequest(item)}
            activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
            <Text style={[styles.cardActionText, {color: "#ef4444"}]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderItem = ({item}: {item: FlatItem}) => {
    switch (item.type) {
      case "search":
        return (
          <View style={[styles.searchContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, {color: colors.foreground}]}
              placeholder="Buscar por nombre, categoría..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        );
      case "tabs":
        return (
          <View style={[styles.tabs, {borderBottomColor: colors.border}]}>
            {(["all", "active", "inactive"] as StatusFilter[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, statusFilter === tab && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}
                onPress={() => setStatusFilter(tab)}>
                <Text
                  style={[styles.tabText, {color: statusFilter === tab ? colors.primary : colors.mutedForeground}]}>
                  {tab === "all" ? "Todos" : tab === "active" ? "Activos" : "Inactivos"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case "count":
        return (
          <View style={styles.countRow}>
            <Text style={[styles.countText, {color: colors.mutedForeground}]}>
              {item.count} servicio{item.count !== 1 ? "s" : ""}
            </Text>
          </View>
        );
      case "category_header":
        return (
          <View style={styles.categoryHeader}>
            <Text style={[styles.categoryLabel, {color: colors.mutedForeground}]}>
              {item.category}
            </Text>
            <View style={[styles.categoryBadge, {backgroundColor: colors.muted}]}>
              <Text style={[styles.categoryBadgeText, {color: colors.mutedForeground}]}>
                {item.count}
              </Text>
            </View>
          </View>
        );
      case "service":
        return item.service ? renderCard(item.service) : null;
      default:
        return null;
    }
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    if (searchQuery || statusFilter !== "all") {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, {backgroundColor: colors.muted}]}>
            <Ionicons name="search-outline" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, {color: colors.foreground}]}>Sin resultados</Text>
          <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
            No se encontraron servicios con esos filtros
          </Text>
          <TouchableOpacity
            style={[styles.emptyCta, {backgroundColor: colors.primary + "15"}]}
            onPress={() => { setSearchQuery(""); setStatusFilter("all"); }}
            activeOpacity={0.85}>
            <Text style={[styles.emptyCtaText, {color: colors.primary}]}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, {backgroundColor: colors.primary + "12"}]}>
          <Ionicons name="briefcase-outline" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, {color: colors.foreground}]}>No hay servicios</Text>
        <Text style={[styles.emptyDescription, {color: colors.mutedForeground}]}>
          Crea tu primer servicio para que tus clientes puedan reservar contigo
        </Text>
        <TouchableOpacity
          style={[styles.emptyCta, {backgroundColor: colors.primary}]}
          onPress={() => router.push("/service/create")}
          activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.emptyCtaTextLight}>Crear servicio</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <AppHeader
        title="Mis Servicios"
        showBackButton
        backFallbackRoute="/(tabs)/perfil"
        backgroundColor={colors.background}
        borderBottom={colors.border}
        rightExtra={
          services.length > 0 ? (
            <TouchableOpacity
              onPress={() => router.push("/service/create")}
              activeOpacity={0.7}
              style={[styles.addBtn, {backgroundColor: colors.primary}]}>
              <Ionicons name="add" color="#ffffff" size={22} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading && services.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : services.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) => {
            if (item.type === "search") return "__search__";
            if (item.type === "tabs") return "__tabs__";
            if (item.type === "count") return "__count__";
            if (item.type === "category_header") return `cat-${item.category}`;
            if (item.type === "service" && item.service) return `svc-${item.service.type}-${item.service.id}`;
            return `item-${i}`;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {deleteTarget && (
        <View style={[styles.modalOverlay, {backgroundColor: "rgba(0,0,0,0.5)"}]}>
          <View style={[styles.modalCard, {backgroundColor: colors.card}]}>
            <View style={[styles.modalIconWrap, {backgroundColor: "#ef4444" + "15"}]}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, {color: colors.foreground}]}>Eliminar servicio</Text>
            <Text style={[styles.modalDescription, {color: colors.mutedForeground}]}>
              ¿Eliminar "{deleteTarget.name}"? Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: colors.muted}]}
                onPress={() => setDeleteTarget(null)}
                activeOpacity={0.8}>
                <Text style={[styles.modalBtnText, {color: colors.foreground}]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, {backgroundColor: "#ef4444"}]}
                onPress={confirmDelete}
                activeOpacity={0.8}>
                <Text style={styles.modalBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  addBtn: {
    width: APP_HEADER_BUTTON_HIT,
    height: APP_HEADER_BUTTON_HIT,
    borderRadius: APP_HEADER_BUTTON_HIT / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32},
  listContent: {paddingHorizontal: 20, paddingBottom: 40},

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  searchInput: {flex: 1, fontSize: 15},

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {fontSize: 13, fontWeight: "700"},

  countRow: {paddingVertical: 8},
  countText: {fontSize: 13, fontWeight: "600"},

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  categoryLabel: {fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5},
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  categoryBadgeText: {fontSize: 11, fontWeight: "700"},

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.04, shadowRadius: 6},
      android: {elevation: 1},
    }),
  },
  cardTop: {flexDirection: "row", alignItems: "center", gap: 12},
  iconWrap: {width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center"},
  cardInfo: {flex: 1, gap: 2},
  cardName: {fontSize: 15, fontWeight: "700", letterSpacing: -0.2},
  cardCategory: {fontSize: 12, fontWeight: "500"},
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: {width: 6, height: 6, borderRadius: 3},
  statusText: {fontSize: 11, fontWeight: "700"},
  cardDescription: {fontSize: 13, lineHeight: 18},
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    flexWrap: "wrap",
  },
  metaItem: {flexDirection: "row", alignItems: "center", gap: 4},
  metaText: {fontSize: 12, fontWeight: "600"},
  metaPrice: {fontSize: 13, fontWeight: "700", letterSpacing: -0.2},
  metaDot: {width: 3, height: 3, borderRadius: 1.5, opacity: 0.4},
  cardActions: {flexDirection: "row", gap: 8},
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  cardActionText: {fontSize: 13, fontWeight: "600"},

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: {fontSize: 17, fontWeight: "700"},
  emptyDescription: {fontSize: 14, textAlign: "center", lineHeight: 20},
  emptyCta: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  emptyCtaText: {fontSize: 13, fontWeight: "600"},
  emptyCtaTextLight: {color: "#ffffff", fontSize: 14, fontWeight: "600"},

  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    zIndex: 100,
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 24},
      android: {elevation: 8},
    }),
  },
  modalIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  modalTitle: {fontSize: 17, fontWeight: "700"},
  modalDescription: {fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 8},
  modalActions: {flexDirection: "row", gap: 10, width: "100%"},
  modalBtn: {flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center"},
  modalBtnText: {color: "#ffffff", fontSize: 14, fontWeight: "600"},
});
