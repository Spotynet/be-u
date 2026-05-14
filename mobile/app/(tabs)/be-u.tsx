import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import {useAppTheme} from "@/constants/theme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {Ionicons} from "@expo/vector-icons";
import {useState, useRef, useEffect} from "react";
import {useColorScheme} from "@/hooks/use-color-scheme";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Nabbi() {
  const colorScheme = useColorScheme();
  const theme = useAppTheme();
  const {colors} = useThemeVariant();
  const scrollViewRef = useRef<ScrollView>(null);

  const [view, setView] = useState<"chat" | "options" | "booking" | "success">("chat");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16, backgroundColor: colors.primary },
    aiAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.25)", justifyContent: "center", alignItems: "center", marginRight: 12 },
    aiAvatarIcon: { width: 24, height: 24 },
    headerText: { flex: 1 },
    aiName: { color: theme.white, fontSize: 20, fontWeight: "800", marginBottom: 2 },
    aiStatus: { color: theme.white, fontSize: 13, fontWeight: "600", opacity: 0.95 },
    chatContainer: { flex: 1 },
    chatContent: { padding: 20, paddingBottom: 40 },
    messageContainer: { marginBottom: 16 },
    aiMessage: { alignSelf: "flex-start", maxWidth: "85%", padding: 16, borderRadius: 20, borderBottomLeftRadius: 4 },
    userMessage: { alignSelf: "flex-end", maxWidth: "85%", padding: 16, borderRadius: 20, borderBottomRightRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    messageTime: { fontSize: 11, marginTop: 8, opacity: 0.7 },
    userMessageText: { color: theme.white, fontSize: 15, lineHeight: 22 },
    userMessageTime: { color: theme.white, fontSize: 11, marginTop: 8, opacity: 0.8 },
    optionsButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16, gap: 12, shadowColor: "#FF69B4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    optionsButtonText: { color: theme.white, fontSize: 16, fontWeight: "800" },
    inputContainer: { padding: 20, borderTopWidth: 1 },
    inputWrapper: { flexDirection: "row", alignItems: "flex-end", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, minHeight: 48 },
    textInput: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 8 },
    sendButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginLeft: 12 },
    optionsHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 },
    backButton: { marginRight: 16 },
    optionsHeaderTitle: { fontSize: 24, fontWeight: "800" },
    optionsHeaderSubtitle: { fontSize: 14, fontWeight: "600", marginTop: 2 },
    optionsContainer: { flex: 1 },
    optionsContent: { padding: 20, paddingBottom: 120 },
    summaryCard: { padding: 20, borderRadius: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    summaryTitle: { fontSize: 17, fontWeight: "800" },
    summaryText: { fontSize: 14, lineHeight: 20 },
    optionCard: { borderRadius: 24, marginBottom: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
    optionImage: { width: "100%", height: 180, resizeMode: "cover" },
    optionContent: { padding: 20 },
    optionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    optionName: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
    optionType: { fontSize: 14, fontWeight: "600" },
    selectedBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
    optionDetails: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
    optionRating: { flexDirection: "row", alignItems: "center", gap: 4 },
    optionRatingText: { fontSize: 15, fontWeight: "700" },
    optionReviews: { fontSize: 13 },
    optionLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
    optionLocationText: { fontSize: 13, fontWeight: "600" },
    optionAvailability: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
    optionAvailabilityText: { fontSize: 14, fontWeight: "700" },
    optionFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    optionPrice: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    optionPriceText: { fontSize: 20, fontWeight: "900" },
    optionLocationName: { fontSize: 13, fontWeight: "600" },
    continueContainer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
    continueButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, gap: 12 },
    continueButtonText: { color: theme.white, fontSize: 17, fontWeight: "800" },
    bookingHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 48, paddingBottom: 16 },
    bookingHeaderTitle: { fontSize: 24, fontWeight: "800" },
    bookingContainer: { flex: 1 },
    bookingContent: { padding: 20, paddingBottom: 120 },
    bookingCard: { flexDirection: "row", padding: 16, borderRadius: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    bookingImage: { width: 80, height: 80, borderRadius: 16, marginRight: 16 },
    bookingCardContent: { flex: 1, justifyContent: "center" },
    bookingName: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
    bookingSpecialty: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
    bookingRating: { flexDirection: "row", alignItems: "center", gap: 4 },
    bookingRatingText: { fontSize: 14, fontWeight: "700" },
    detailsSection: { padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 20 },
    detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    detailIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFE8F0", justifyContent: "center", alignItems: "center", marginRight: 16 },
    detailLabel: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
    detailValue: { fontSize: 16, fontWeight: "700" },
    notesSection: { padding: 20, borderRadius: 20, marginBottom: 20 },
    notesInput: { padding: 16, borderRadius: 12, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
    infoBox: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, gap: 12 },
    infoText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 20 },
    confirmContainer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
    confirmButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, gap: 12 },
    confirmButtonText: { color: theme.white, fontSize: 17, fontWeight: "800" },
    successContainer: { flexGrow: 1, padding: 20, paddingTop: 80 },
    successContent: { alignItems: "center" },
    successIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: "center", alignItems: "center", marginBottom: 32, shadowColor: "#4CAF50", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
    successTitle: { fontSize: 28, fontWeight: "900", marginBottom: 12, textAlign: "center" },
    successSubtitle: { fontSize: 16, fontWeight: "600", marginBottom: 40, textAlign: "center" },
    confirmationCard: { width: "100%", padding: 24, borderRadius: 24, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
    confirmationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    confirmationImage: { width: 60, height: 60, borderRadius: 16, marginRight: 16 },
    confirmationName: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
    confirmationSpecialty: { fontSize: 14, fontWeight: "600" },
    confirmationDivider: { height: 1, backgroundColor: "rgba(0, 0, 0, 0.08)", marginBottom: 20 },
    confirmationDetail: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    confirmationText: { fontSize: 15, fontWeight: "600" },
    calendarBox: { width: "100%", flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 16, gap: 16, marginBottom: 32 },
    calendarTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
    calendarSubtitle: { fontSize: 13, fontWeight: "600" },
    successActions: { width: "100%", gap: 12 },
    primaryAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, gap: 12 },
    primaryActionText: { color: theme.white, fontSize: 17, fontWeight: "800" },
    secondaryAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, gap: 12, borderWidth: 2 },
    secondaryActionText: { fontSize: 17, fontWeight: "800" },
  });

  const options = [
    { id: 1, name: "Ana Martínez", type: "Profesional", specialty: "Especialista en Keratina", rating: 4.9, reviews: 234, price: "$950", image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop", location: "Salón Belleza Total", distance: "0.8 km", available: "Sáb 12 Oct - 10:00 AM", color: "#FF69B4" },
    { id: 2, name: "nabbi Hair Studio", type: "Salón", specialty: "Tratamientos Capilares Premium", rating: 4.8, reviews: 456, price: "$1,100", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop", location: "Centro Comercial Plaza", distance: "1.2 km", available: "Sáb 12 Oct - 10:30 AM", color: "#DDA0DD" },
    { id: 3, name: "Lucía Fernández", type: "Profesional", specialty: "Keratina & Alisados", rating: 5.0, reviews: 189, price: "$850", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop", location: "Studio Independiente", distance: "0.5 km", available: "Sáb 12 Oct - 11:00 AM", color: "#FFB347" },
  ];

  const chatData = { treatment: "Tratamiento de keratina + Corte", hairType: "Cabello rizado y con frizz", budget: "$800 - $1,200", date: "Sábado 12 de Octubre", time: "10:00 AM - 12:00 PM" };
  const selectedOptionData = options.find((opt) => opt.id === selectedOption);

  if (view === "chat") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <View style={styles.aiAvatar}>
            <Image source={require("@/assets/images/BE-U-white.png")} style={styles.aiAvatarIcon} resizeMode="contain" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.aiName}>Rita</Text>
            <Text style={styles.aiStatus}>✨ Tu asistente inteligente</Text>
          </View>
        </View>
        <ScrollView ref={scrollViewRef} style={styles.chatContainer} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          <View style={styles.messageContainer}>
            <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
              <Text style={[styles.messageText, {color: colors.foreground}]}>¡Hola! 👋 Soy Rita, tu asistente de belleza inteligente...</Text>
              <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:30</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.userMessage, {backgroundColor: "#FF69B4"}]}>
              <Text style={styles.userMessageText}>Hola! Necesito ayuda con mi cabello...</Text>
              <Text style={styles.userMessageTime}>10:32</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
              <Text style={[styles.messageText, {color: colors.foreground}]}>¡Entiendo perfectamente! 💇‍♀️ ...</Text>
              <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:33</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.userMessage, {backgroundColor: "#FF69B4"}]}>
              <Text style={styles.userMessageText}>Me gustaría alisarlo pero sin perder totalmente el volumen...</Text>
              <Text style={styles.userMessageTime}>10:35</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
              <Text style={[styles.messageText, {color: colors.foreground}]}>¡Perfecto! 🎯 Entonces el <Text style={{fontWeight: "800"}}>tratamiento de keratina</Text> es ideal para ti...</Text>
              <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:36</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.userMessage, {backgroundColor: "#FF69B4"}]}>
              <Text style={styles.userMessageText}>Sí, me parece perfecto! ¿Cuánto cuesta?</Text>
              <Text style={styles.userMessageTime}>10:37</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
              <Text style={[styles.messageText, {color: colors.foreground}]}>El tratamiento de keratina + corte tiene un rango de precio entre <Text style={{fontWeight: "800"}}>$800 - $1,200</Text>...</Text>
              <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:38</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.userMessage, {backgroundColor: "#FF69B4"}]}>
              <Text style={styles.userMessageText}>Busco algo para el próximo sábado por la mañana...</Text>
              <Text style={styles.userMessageTime}>10:40</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
              <Text style={[styles.messageText, {color: colors.foreground}]}>¡Excelente! 🎉 Déjame buscar las mejores opciones para ti...</Text>
              <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:41</Text>
            </View>
          </View>
          <View style={styles.messageContainer}>
            <TouchableOpacity style={[styles.optionsButton, {backgroundColor: "#FF69B4"}]} onPress={() => setView("options")} activeOpacity={0.9}>
              <Ionicons name="grid" color={theme.white} size={20} />
              <Text style={styles.optionsButtonText}>Ver 3 opciones disponibles</Text>
              <Ionicons name="arrow-forward" color={theme.white} size={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View style={[styles.inputContainer, {backgroundColor: colors.background, borderTopColor: colors.border}]}>
          <View style={[styles.inputWrapper, {backgroundColor: colors.input}]}>
            <TextInput style={[styles.textInput, {color: colors.foreground}]} placeholder="Escribe tu mensaje..." placeholderTextColor={colors.mutedForeground} multiline />
            <TouchableOpacity style={[styles.sendButton, {backgroundColor: "#FF69B4"}]}>
              <Ionicons name="send" color={theme.white} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  if (view === "options") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.optionsHeader, {backgroundColor: colors.background}]}>
          <TouchableOpacity onPress={() => setView("chat")} style={styles.backButton}><Ionicons name="chevron-back" color={colors.foreground} size={28} /></TouchableOpacity>
          <View style={{flex: 1}}><Text style={[styles.optionsHeaderTitle, {color: colors.foreground}]}>Opciones para ti</Text><Text style={[styles.optionsHeaderSubtitle, {color: colors.mutedForeground}]}>Sábado 12 Oct • 10:00 AM - 12:00 PM</Text></View>
        </View>
        <ScrollView style={styles.optionsContainer} contentContainerStyle={styles.optionsContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.summaryCard, {backgroundColor: colors.card}]}><View style={styles.summaryHeader}><Ionicons name="checkmark-circle" color="#4CAF50" size={24} /><Text style={[styles.summaryTitle, {color: colors.foreground}]}>Encontramos 3 matches perfectos</Text></View><Text style={[styles.summaryText, {color: colors.mutedForeground}]}>Todos disponibles en tu horario y dentro de tu presupuesto</Text></View>
          {options.map((option) => (
            <TouchableOpacity key={option.id} style={[styles.optionCard, {backgroundColor: colors.card, borderColor: selectedOption === option.id ? colors.primary : colors.border, borderWidth: selectedOption === option.id ? 2 : 1, borderRadius: 12}]} onPress={() => setSelectedOption(option.id)} activeOpacity={0.95}>
              <Image source={{uri: option.image}} style={styles.optionImage} />
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}><View style={{flex: 1}}><Text style={[styles.optionName, {color: colors.foreground}]}>{option.name}</Text><Text style={[styles.optionType, {color: colors.mutedForeground}]}>{option.type} • {option.specialty}</Text></View>{selectedOption === option.id && (<View style={[styles.selectedBadge, {backgroundColor: colors.primary}]}><Ionicons name="checkmark" color={theme.white} size={20} /></View>)}</View>
                <View style={styles.optionDetails}><View style={styles.optionRating}><Ionicons name="star" color="#FFD700" size={16} /><Text style={[styles.optionRatingText, {color: colors.foreground}]}>{option.rating}</Text><Text style={[styles.optionReviews, {color: colors.mutedForeground}]}>({option.reviews} reseñas)</Text></View><View style={styles.optionLocation}><Ionicons name="location" color={colors.mutedForeground} size={14} /><Text style={[styles.optionLocationText, {color: colors.mutedForeground}]}>{option.distance}</Text></View></View>
                <View style={[styles.optionAvailability, {backgroundColor: colors.muted}]}><Ionicons name="calendar" color={colors.secondary} size={16} /><Text style={[styles.optionAvailabilityText, {color: colors.foreground}]}>{option.available}</Text></View>
                <View style={styles.optionFooter}><View style={[styles.optionPrice, {backgroundColor: colors.secondary + "20"}]}><Text style={[styles.optionPriceText, {color: colors.secondary}]}>{typeof option.price === "number" ? Math.round(option.price) : option.price}</Text></View><Text style={[styles.optionLocationName, {color: colors.mutedForeground}]}>📍 {option.location}</Text></View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedOption && (<View style={[styles.continueContainer, {backgroundColor: colors.background}]}><TouchableOpacity style={[styles.continueButton, {backgroundColor: selectedOptionData?.color || "#FF69B4"}]} onPress={() => setView("booking")} activeOpacity={0.9}><Text style={styles.continueButtonText}>Continuar con {selectedOptionData?.name}</Text><Ionicons name="arrow-forward" color={theme.white} size={20} /></TouchableOpacity></View>)}
      </View>
    );
  }
  if (view === "booking") {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.bookingHeader, {backgroundColor: colors.background}]}><TouchableOpacity onPress={() => setView("options")} style={styles.backButton}><Ionicons name="chevron-back" color={colors.foreground} size={28} /></TouchableOpacity><Text style={[styles.bookingHeaderTitle, {color: colors.foreground}]}>Confirmar Reserva</Text></View>
        <ScrollView style={styles.bookingContainer} contentContainerStyle={styles.bookingContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.bookingCard, {backgroundColor: colors.card}]}><Image source={{uri: selectedOptionData?.image}} style={styles.bookingImage} /><View style={styles.bookingCardContent}><Text style={[styles.bookingName, {color: colors.foreground}]}>{selectedOptionData?.name}</Text><Text style={[styles.bookingSpecialty, {color: colors.mutedForeground}]}>{selectedOptionData?.specialty}</Text><View style={styles.bookingRating}><Ionicons name="star" color="#FFD700" size={14} /><Text style={[styles.bookingRatingText, {color: colors.foreground}]}>{selectedOptionData?.rating}</Text></View></View></View>
          <View style={[styles.detailsSection, {backgroundColor: colors.card}]}><Text style={[styles.sectionTitle, {color: colors.foreground}]}>Detalles del Servicio</Text><View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name="cut" color="#FF69B4" size={20} /></View><View style={{flex: 1}}><Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Tratamiento</Text><Text style={[styles.detailValue, {color: colors.foreground}]}>{chatData.treatment}</Text></View></View><View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name="calendar" color="#FF69B4" size={20} /></View><View style={{flex: 1}}><Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Fecha</Text><Text style={[styles.detailValue, {color: colors.foreground}]}>{chatData.date}</Text></View></View><View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name="time" color="#FF69B4" size={20} /></View><View style={{flex: 1}}><Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Horario</Text><Text style={[styles.detailValue, {color: colors.foreground}]}>{selectedOptionData?.available}</Text></View></View><View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name="location" color="#FF69B4" size={20} /></View><View style={{flex: 1}}><Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Lugar</Text><Text style={[styles.detailValue, {color: colors.foreground}]}>{selectedOptionData?.location}</Text></View></View><View style={styles.detailRow}><View style={styles.detailIcon}><Ionicons name="cash" color="#FF69B4" size={20} /></View><View style={{flex: 1}}><Text style={[styles.detailLabel, {color: colors.mutedForeground}]}>Precio</Text><Text style={[styles.detailValue, {color: colors.foreground}]}>{typeof selectedOptionData?.price === "number" ? Math.round(selectedOptionData.price) : selectedOptionData?.price}</Text></View></View></View>
          <View style={[styles.notesSection, {backgroundColor: colors.card}]}><Text style={[styles.sectionTitle, {color: colors.foreground}]}>Notas adicionales (Opcional)</Text><TextInput style={[styles.notesInput, {backgroundColor: colors.muted, color: colors.foreground}]} placeholder="Ej: Alergia a ciertos productos, preferencias específicas..." placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} /></View>
          <View style={[styles.infoBox, {backgroundColor: "#E3F2FD"}]}><Ionicons name="information-circle" color="#2196F3" size={20} /><Text style={[styles.infoText, {color: "#1976D2"}]}>Al confirmar, se agregará automáticamente a tu calendario y al del profesional</Text></View>
        </ScrollView>
        <View style={[styles.confirmContainer, {backgroundColor: colors.background}]}><TouchableOpacity style={[styles.confirmButton, {backgroundColor: "#4CAF50"}]} onPress={() => setView("success")} activeOpacity={0.9}><Ionicons name="calendar" color={theme.white} size={20} /><Text style={styles.confirmButtonText}>Confirmar Reserva</Text></TouchableOpacity></View>
      </View>
    );
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.successContent}>
          <View style={[styles.successIcon, {backgroundColor: "#4CAF50"}]}><Ionicons name="checkmark" color={theme.white} size={64} /></View>
          <Text style={[styles.successTitle, {color: colors.foreground}]}>¡Reserva Confirmada! 🎉</Text><Text style={[styles.successSubtitle, {color: colors.mutedForeground}]}>Tu cita ha sido agendada exitosamente</Text>
          <View style={[styles.confirmationCard, {backgroundColor: colors.card}]}><View style={styles.confirmationHeader}><Image source={{uri: selectedOptionData?.image}} style={styles.confirmationImage} /><View style={{flex: 1}}><Text style={[styles.confirmationName, {color: colors.foreground}]}>{selectedOptionData?.name}</Text><Text style={[styles.confirmationSpecialty, {color: colors.mutedForeground}]}>{selectedOptionData?.specialty}</Text></View></View><View style={styles.confirmationDivider} /><View style={styles.confirmationDetail}><Ionicons name="cut" color="#FF69B4" size={18} /><Text style={[styles.confirmationText, {color: colors.foreground}]}>{chatData.treatment}</Text></View><View style={styles.confirmationDetail}><Ionicons name="calendar" color="#FF69B4" size={18} /><Text style={[styles.confirmationText, {color: colors.foreground}]}>{chatData.date}</Text></View><View style={styles.confirmationDetail}><Ionicons name="time" color="#FF69B4" size={18} /><Text style={[styles.confirmationText, {color: colors.foreground}]}>{selectedOptionData?.available}</Text></View><View style={styles.confirmationDetail}><Ionicons name="location" color="#FF69B4" size={18} /><Text style={[styles.confirmationText, {color: colors.foreground}]}>{selectedOptionData?.location}</Text></View></View>
          <View style={[styles.calendarBox, {backgroundColor: "#E8F5E9"}]}><Ionicons name="calendar-outline" color="#4CAF50" size={24} /><View style={{flex: 1}}><Text style={[styles.calendarTitle, {color: "#2E7D32"}]}>Añadido a tu calendario</Text><Text style={[styles.calendarSubtitle, {color: "#558B2F"}]}>Recibirás un recordatorio 1 día antes</Text></View></View>
          <View style={styles.successActions}><TouchableOpacity style={[styles.primaryAction, {backgroundColor: "#FF69B4"}]} onPress={() => setView("chat")} activeOpacity={0.9}><Ionicons name="chatbubble" color={theme.white} size={20} /><Text style={styles.primaryActionText}>Volver al chat</Text></TouchableOpacity></View>
        </View>
      </ScrollView>
    </View>
  );
}
