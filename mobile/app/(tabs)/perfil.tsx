import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

type ProfileType = "client" | "professional" | "salon";

export default function Perfil() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [activeTab, setActiveTab] = useState<ProfileType>("client");

  // Mock data para Cliente
  const clientData = {
    name: "María González",
    email: "maria@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop",
    memberSince: "Enero 2024",
    reservations: 12,
    reviews: 8,
    favorites: 15,
  };

  // Mock data para Profesional
  const professionalData = {
    name: "Carlos Estilista",
    specialty: "Coloración y Corte",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    rating: 4.9,
    reviews: 234,
    yearsExp: 8,
    verified: true,
    services: [
      {id: 1, name: "Corte Caballero", price: "$300", duration: "30 min"},
      {id: 2, name: "Coloración", price: "$800", duration: "90 min"},
      {id: 3, name: "Barba", price: "$200", duration: "20 min"},
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&h=300&fit=crop",
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=300&fit=crop",
    ],
  };

  // Mock data para Salón
  const salonData = {
    name: "BE-U Spa Premium",
    category: "Spa & Belleza",
    avatar: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
    rating: 4.8,
    reviews: 456,
    address: "Roma Norte, CDMX",
    phone: "+52 55 1234 5678",
    verified: true,
    team: 12,
    services: 25,
    photos: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=200&fit=crop",
      "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=300&h=200&fit=crop",
    ],
    teamMembers: [
      {
        id: 1,
        name: "Ana López",
        role: "Masajista",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop",
      },
      {
        id: 2,
        name: "Juan Pérez",
        role: "Terapeuta",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      {
        id: 3,
        name: "Laura Ruiz",
        role: "Esteticista",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      },
    ],
  };

  const renderClientProfile = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Client Header */}
      <View style={styles.profileHeader}>
        <Image source={{uri: clientData.avatar}} style={styles.avatar} />
        <Text style={[styles.profileName, {color: colors.foreground}]}>{clientData.name}</Text>
        <Text style={[styles.profileEmail, {color: colors.mutedForeground}]}>
          {clientData.email}
        </Text>
        <Text style={[styles.memberSince, {color: colors.mutedForeground}]}>
          Miembro desde {clientData.memberSince}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Ionicons name="calendar" color={colors.primary} size={24} />
          <Text style={[styles.statNumber, {color: colors.foreground}]}>
            {clientData.reservations}
          </Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Reservas</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Ionicons name="star" color="#fbbf24" size={24} />
          <Text style={[styles.statNumber, {color: colors.foreground}]}>{clientData.reviews}</Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Reviews</Text>
        </View>
        <View style={[styles.statCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
          <Ionicons name="heart" color="#ef4444" size={24} />
          <Text style={[styles.statNumber, {color: colors.foreground}]}>
            {clientData.favorites}
          </Text>
          <Text style={[styles.statLabel, {color: colors.mutedForeground}]}>Favoritos</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Acciones</Text>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="calendar-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Mis Reservas</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="heart-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Favoritos</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Mis Reviews</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="settings-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Configuración</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderProfessionalProfile = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Professional Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{uri: professionalData.avatar}} style={styles.avatar} />
          {professionalData.verified && (
            <View style={[styles.verifiedBadge, {backgroundColor: colors.primary}]}>
              <Ionicons name="checkmark" color="#ffffff" size={16} />
            </View>
          )}
        </View>
        <Text style={[styles.profileName, {color: colors.foreground}]}>
          {professionalData.name}
        </Text>
        <Text style={[styles.specialty, {color: colors.primary}]}>
          {professionalData.specialty}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" color="#fbbf24" size={18} />
          <Text style={[styles.ratingText, {color: colors.foreground}]}>
            {professionalData.rating}
          </Text>
          <Text style={[styles.reviewsCount, {color: colors.mutedForeground}]}>
            ({professionalData.reviews} reviews)
          </Text>
        </View>
        <Text style={[styles.experience, {color: colors.mutedForeground}]}>
          {professionalData.yearsExp} años de experiencia
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={[styles.quickStat, {backgroundColor: "#ec4899" + "15"}]}>
          <Ionicons name="cut" color="#ec4899" size={20} />
          <Text style={[styles.quickStatText, {color: colors.foreground}]}>
            {professionalData.services.length} Servicios
          </Text>
        </View>
        <View style={[styles.quickStat, {backgroundColor: "#8b5cf6" + "15"}]}>
          <Ionicons name="images" color="#8b5cf6" size={20} />
          <Text style={[styles.quickStatText, {color: colors.foreground}]}>
            {professionalData.portfolio.length} Fotos
          </Text>
        </View>
      </View>

      {/* Services */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Mis Servicios</Text>
        {professionalData.services.map((service) => (
          <View
            key={service.id}
            style={[
              styles.serviceCard,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceName, {color: colors.foreground}]}>{service.name}</Text>
              <Text style={[styles.serviceDuration, {color: colors.mutedForeground}]}>
                {service.duration}
              </Text>
            </View>
            <Text style={[styles.servicePrice, {color: colors.primary}]}>{service.price}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: colors.primary}]}
          activeOpacity={0.9}>
          <Ionicons name="add" color="#ffffff" size={20} />
          <Text style={styles.addButtonText}>Agregar Servicio</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Portfolio</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" color={colors.primary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.portfolioGrid}>
          {professionalData.portfolio.map((photo, index) => (
            <TouchableOpacity key={index} style={styles.portfolioItem} activeOpacity={0.8}>
              <Image source={{uri: photo}} style={styles.portfolioImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="calendar-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Mi Agenda</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Estadísticas</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSalonProfile = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Salon Header */}
      <View style={styles.salonHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{uri: salonData.avatar}} style={styles.salonAvatar} />
          {salonData.verified && (
            <View style={[styles.verifiedBadge, {backgroundColor: colors.primary}]}>
              <Ionicons name="checkmark" color="#ffffff" size={16} />
            </View>
          )}
        </View>
        <Text style={[styles.salonName, {color: colors.foreground}]}>{salonData.name}</Text>
        <Text style={[styles.salonCategory, {color: colors.mutedForeground}]}>
          {salonData.category}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" color="#fbbf24" size={18} />
          <Text style={[styles.ratingText, {color: colors.foreground}]}>{salonData.rating}</Text>
          <Text style={[styles.reviewsCount, {color: colors.mutedForeground}]}>
            ({salonData.reviews} reviews)
          </Text>
        </View>
      </View>

      {/* Salon Info */}
      <View
        style={[styles.salonInfoCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
        <View style={styles.infoRow}>
          <Ionicons name="location" color={colors.primary} size={20} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>{salonData.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" color={colors.primary} size={20} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>{salonData.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people" color={colors.primary} size={20} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>
            {salonData.team} profesionales
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cut" color={colors.primary} size={20} />
          <Text style={[styles.infoText, {color: colors.foreground}]}>
            {salonData.services} servicios
          </Text>
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Fotos del Local</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" color={colors.primary} size={24} />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScroll}>
          {salonData.photos.map((photo, index) => (
            <TouchableOpacity key={index} style={styles.photoCard} activeOpacity={0.8}>
              <Image source={{uri: photo}} style={styles.photoImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Nuestro Equipo</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, {color: colors.primary}]}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {salonData.teamMembers.map((member) => (
          <View
            key={member.id}
            style={[styles.teamCard, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <Image source={{uri: member.avatar}} style={styles.teamAvatar} />
            <View style={styles.teamInfo}>
              <Text style={[styles.teamName, {color: colors.foreground}]}>{member.name}</Text>
              <Text style={[styles.teamRole, {color: colors.mutedForeground}]}>{member.role}</Text>
            </View>
            <TouchableOpacity style={[styles.teamButton, {backgroundColor: colors.primary}]}>
              <Text style={styles.teamButtonText}>Ver perfil</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Gestión</Text>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="calendar-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Agenda del Salón</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="people-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Gestionar Equipo</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Estadísticas</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: colors.card, borderColor: colors.border}]}
          activeOpacity={0.7}>
          <Ionicons name="settings-outline" color={colors.foreground} size={22} />
          <Text style={[styles.actionText, {color: colors.foreground}]}>Configuración</Text>
          <Ionicons name="chevron-forward" color={colors.mutedForeground} size={20} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <Text style={[styles.headerTitle, {color: colors.foreground}]}>Perfil</Text>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          {backgroundColor: colors.background, borderBottomColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "client" && [styles.activeTab, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => setActiveTab("client")}
          activeOpacity={0.7}>
          <Ionicons
            name="person"
            color={activeTab === "client" ? colors.primary : colors.mutedForeground}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === "client" ? colors.primary : colors.mutedForeground},
            ]}>
            Cliente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "professional" && [styles.activeTab, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => setActiveTab("professional")}
          activeOpacity={0.7}>
          <Ionicons
            name="cut"
            color={activeTab === "professional" ? colors.primary : colors.mutedForeground}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === "professional" ? colors.primary : colors.mutedForeground},
            ]}>
            Profesional
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "salon" && [styles.activeTab, {borderBottomColor: colors.primary}],
          ]}
          onPress={() => setActiveTab("salon")}
          activeOpacity={0.7}>
          <Ionicons
            name="business"
            color={activeTab === "salon" ? colors.primary : colors.mutedForeground}
            size={20}
          />
          <Text
            style={[
              styles.tabText,
              {color: activeTab === "salon" ? colors.primary : colors.mutedForeground},
            ]}>
            Salón
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "client" && renderClientProfile()}
      {activeTab === "professional" && renderProfessionalProfile()}
      {activeTab === "salon" && renderSalonProfile()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },

  // Common
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 16,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },

  // Client
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
  },

  // Professional
  specialty: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  reviewsCount: {
    fontSize: 14,
  },
  experience: {
    fontSize: 14,
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickStatText: {
    fontSize: 14,
    fontWeight: "600",
  },
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 13,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  portfolioItem: {
    width: (SCREEN_WIDTH - 44) / 3,
    aspectRatio: 1,
  },
  portfolioImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    resizeMode: "cover",
  },

  // Salon
  salonHeader: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  salonAvatar: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
  },
  salonName: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  salonCategory: {
    fontSize: 15,
    marginBottom: 12,
  },
  salonInfoCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
  },
  photosScroll: {
    paddingRight: 16,
    gap: 12,
  },
  photoCard: {
    width: 240,
    height: 160,
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  teamAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 13,
  },
  teamButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  teamButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
