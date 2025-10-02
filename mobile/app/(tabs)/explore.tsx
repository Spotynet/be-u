import {View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

export default function Explore() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [activeCategory, setActiveCategory] = useState("todos");
  const [viewMode, setViewMode] = useState<"mapa" | "lista">("mapa");

  const categories = [
    {id: "todos", name: "Todos", icon: "heart"},
    {id: "manicure", name: "Manicure & Pedicure", icon: "hand-left"},
    {id: "makeup", name: "Make Up", icon: "brush"},
    {id: "barberia", name: "Barbería", icon: "cut"},
    {id: "facial", name: "Facial", icon: "flower"},
    {id: "masaje", name: "Masaje", icon: "fitness"},
  ];

  const salons = [
    {
      id: 1,
      name: "BE-U Spa Premium",
      rating: 4.8,
      distance: "0.5 km",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=200&fit=crop",
      services: ["Facial", "Masaje", "Manicure"],
      price: "Desde $800",
      location: "Roma Norte, CDMX",
      isFavorite: true,
    },
    {
      id: 2,
      name: "BE-U Hair Studio",
      rating: 4.9,
      distance: "1.2 km",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=200&fit=crop",
      services: ["Corte", "Color", "Peinado"],
      price: "Desde $600",
      location: "Polanco, CDMX",
      isFavorite: false,
    },
    {
      id: 3,
      name: "BE-U Beauty Bar",
      rating: 4.7,
      distance: "0.8 km",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=200&fit=crop",
      services: ["Manicure", "Pedicure", "Makeup"],
      price: "Desde $500",
      location: "Condesa, CDMX",
      isFavorite: true,
    },
  ];

  const renderMapView = () => (
    <View style={[styles.mapContainer, {backgroundColor: colors.muted}]}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" color={colors.mutedForeground} size={64} />
        <Text style={[styles.mapPlaceholderText, {color: colors.mutedForeground}]}>
          Vista de Mapa
        </Text>
        <Text style={[styles.mapPlaceholderSubtext, {color: colors.mutedForeground}]}>
          Aquí se mostraría el mapa interactivo
        </Text>

        {/* Map Markers */}
        <View style={styles.mapMarkers}>
          <View style={[styles.marker, {backgroundColor: colors.primary}]}>
            <Ionicons name="location" color="#ffffff" size={16} />
          </View>
          <View style={[styles.marker, {backgroundColor: "#ef4444"}]}>
            <Ionicons name="heart" color="#ffffff" size={12} />
          </View>
          <View style={[styles.marker, {backgroundColor: "#10b981"}]}>
            <Ionicons name="star" color="#ffffff" size={12} />
          </View>
        </View>
      </View>

      {/* Bottom Card */}
      <View style={[styles.bottomCard, {backgroundColor: colors.background}]}>
        <View style={styles.salonCard}>
          <Image source={{uri: salons[0].image}} style={styles.salonImage} />
          <View style={styles.salonInfo}>
            <Text style={[styles.salonName, {color: colors.foreground}]}>{salons[0].name}</Text>
            <View style={styles.salonDetails}>
              <Ionicons name="star" color="#fbbf24" size={16} />
              <Text style={[styles.rating, {color: colors.foreground}]}>{salons[0].rating}</Text>
              <Text style={[styles.distance, {color: colors.mutedForeground}]}>
                • {salons[0].distance}
              </Text>
            </View>
            <TouchableOpacity style={[styles.detailsButton, {backgroundColor: colors.primary}]}>
              <Text style={[styles.detailsButtonText, {color: "#ffffff"}]}>Detalles</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderListView = () => (
    <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
      {salons.map((salon) => (
        <View
          key={salon.id}
          style={[styles.salonCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <View style={styles.salonImageContainer}>
            <Image source={{uri: salon.image}} style={styles.salonImage} />
            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons
                name={salon.isFavorite ? "heart" : "heart-outline"}
                color={salon.isFavorite ? "#ef4444" : colors.mutedForeground}
                size={20}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.salonContent}>
            <View style={styles.salonHeader}>
              <Text style={[styles.salonName, {color: colors.foreground}]}>{salon.name}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" color="#fbbf24" size={16} />
                <Text style={[styles.rating, {color: colors.foreground}]}>{salon.rating}</Text>
              </View>
            </View>

            <Text style={[styles.salonLocation, {color: colors.mutedForeground}]}>
              {salon.location} • {salon.distance}
            </Text>

            <View style={styles.servicesContainer}>
              {salon.services.map((service, index) => (
                <View key={index} style={[styles.serviceTag, {backgroundColor: colors.muted}]}>
                  <Text style={[styles.serviceText, {color: colors.foreground}]}>{service}</Text>
                </View>
              ))}
            </View>

            <View style={styles.salonFooter}>
              <Text style={[styles.price, {color: colors.primary}]}>{salon.price}</Text>
              <TouchableOpacity style={[styles.bookButton, {backgroundColor: colors.primary}]}>
                <Ionicons name="calendar" color="#ffffff" size={16} />
                <Text style={[styles.bookButtonText, {color: "#ffffff"}]}>Reservar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Location Header */}
      <View style={[styles.locationHeader, {backgroundColor: colors.background}]}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" color={colors.primary} size={20} />
          <Text style={[styles.locationText, {color: colors.foreground}]}>Mi ubicación</Text>
        </View>
        <Text style={[styles.address, {color: colors.mutedForeground}]}>
          Orizaba 154, Roma Nte, Cuauhtémoc, 06700, CDMX
        </Text>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryItem, activeCategory === category.id && styles.activeCategory]}
            onPress={() => setActiveCategory(category.id)}>
            <Ionicons
              name={category.icon as any}
              color={activeCategory === category.id ? colors.primary : colors.mutedForeground}
              size={20}
            />
            <Text
              style={[
                styles.categoryText,
                {color: activeCategory === category.id ? colors.primary : colors.mutedForeground},
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBar, {backgroundColor: colors.input, borderColor: colors.border}]}>
          <Ionicons name="search" color={colors.mutedForeground} size={20} />
          <TextInput
            style={[styles.searchInput, {color: colors.foreground}]}
            placeholder="Buscar salones, servicios..."
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggle,
            viewMode === "mapa" && styles.activeViewToggle,
            viewMode === "mapa" && {backgroundColor: colors.primary},
          ]}
          onPress={() => setViewMode("mapa")}>
          <Ionicons
            name="map"
            color={viewMode === "mapa" ? "#ffffff" : colors.mutedForeground}
            size={18}
          />
          <Text
            style={[
              styles.viewToggleText,
              {color: viewMode === "mapa" ? "#ffffff" : colors.mutedForeground},
            ]}>
            Mapa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggle,
            viewMode === "lista" && styles.activeViewToggle,
            viewMode === "lista" && {backgroundColor: colors.primary},
          ]}
          onPress={() => setViewMode("lista")}>
          <Ionicons
            name="list"
            color={viewMode === "lista" ? "#ffffff" : colors.mutedForeground}
            size={18}
          />
          <Text
            style={[
              styles.viewToggleText,
              {color: viewMode === "lista" ? "#ffffff" : colors.mutedForeground},
            ]}>
            Lista
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {viewMode === "mapa" ? renderMapView() : renderListView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    gap: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  address: {
    flex: 1,
    fontSize: 14,
  },
  categoriesContainer: {
    paddingVertical: 4,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    paddingVertical: 4,
    paddingBottom: 2,
    minWidth: 80,
  },
  activeCategory: {
    // No border needed
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  viewToggleContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  viewToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    gap: 6,
  },
  activeViewToggle: {
    backgroundColor: "#8b5cf6",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  mapMarkers: {
    position: "absolute",
    top: "30%",
    left: "20%",
    gap: 20,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  salonCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  salonImageContainer: {
    position: "relative",
    height: 200,
  },
  salonImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  salonContent: {
    padding: 16,
  },
  salonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  salonName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
  },
  salonLocation: {
    fontSize: 14,
    marginBottom: 12,
  },
  servicesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  serviceTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  salonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  salonDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
