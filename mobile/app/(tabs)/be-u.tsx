import {View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity} from "react-native";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {Ionicons} from "@expo/vector-icons";

export default function BeU() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" color="#ffffff" size={24} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.aiName, {color: "#ffffff"}]}>BE-U Assistant</Text>
          <Text style={[styles.aiStatus, {color: "#ffffff"}]}>En línea</Text>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
        {/* AI Welcome Message */}
        <View style={styles.messageContainer}>
          <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
            <Text style={[styles.messageText, {color: colors.foreground}]}>
              ¡Hola! 👋 Soy tu asistente de belleza BE-U. ¿En qué puedo ayudarte hoy?
            </Text>
            <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:30</Text>
          </View>
        </View>

        {/* User Message */}
        <View style={styles.messageContainer}>
          <View style={[styles.userMessage, {backgroundColor: colors.primary}]}>
            <Text style={[styles.messageText, {color: "#ffffff"}]}>
              ¿Qué servicios de cabello tienes disponibles?
            </Text>
            <Text style={[styles.messageTime, {color: "#ffffff"}]}>10:32</Text>
          </View>
        </View>

        {/* AI Response */}
        <View style={styles.messageContainer}>
          <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
            <Text style={[styles.messageText, {color: colors.foreground}]}>
              ¡Excelente pregunta! 💇‍♀️ Tenemos varios servicios de cabello:
              {"\n\n"}• Corte y peinado
              {"\n"}• Coloración y mechas
              {"\n"}• Tratamientos capilares
              {"\n"}• Alisado y permanente
              {"\n\n"}¿Te interesa alguno en particular?
            </Text>
            <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:33</Text>
          </View>
        </View>

        {/* User Message */}
        <View style={styles.messageContainer}>
          <View style={[styles.userMessage, {backgroundColor: colors.primary}]}>
            <Text style={[styles.messageText, {color: "#ffffff"}]}>
              Me interesa el tratamiento capilar
            </Text>
            <Text style={[styles.messageTime, {color: "#ffffff"}]}>10:35</Text>
          </View>
        </View>

        {/* AI Response */}
        <View style={styles.messageContainer}>
          <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
            <Text style={[styles.messageText, {color: colors.foreground}]}>
              ¡Perfecto! 🌟 Nuestros tratamientos capilares incluyen:
              {"\n\n"}• Hidratación profunda
              {"\n"}• Keratina
              {"\n"}• Botox capilar
              {"\n"}• Tratamiento anti-caída
              {"\n\n"}¿Te gustaría agendar una cita? Puedo ayudarte con eso.
            </Text>
            <Text style={[styles.messageTime, {color: colors.mutedForeground}]}>10:36</Text>
          </View>
        </View>

        {/* Typing Indicator */}
        <View style={styles.messageContainer}>
          <View style={[styles.aiMessage, {backgroundColor: colors.muted}]}>
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, {backgroundColor: colors.mutedForeground}]} />
              <View style={[styles.typingDot, {backgroundColor: colors.mutedForeground}]} />
              <View style={[styles.typingDot, {backgroundColor: colors.mutedForeground}]} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          {backgroundColor: colors.background, borderTopColor: colors.border},
        ]}>
        <View
          style={[
            styles.inputWrapper,
            {backgroundColor: colors.input, borderColor: colors.border},
          ]}>
          <TextInput
            style={[styles.textInput, {color: colors.foreground}]}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor={colors.mutedForeground}
            multiline
          />
          <TouchableOpacity style={[styles.sendButton, {backgroundColor: colors.primary}]}>
            <Ionicons name="send" color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 16,
    paddingTop: 60,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  aiName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  aiStatus: {
    fontSize: 14,
    opacity: 0.8,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  aiMessage: {
    alignSelf: "flex-start",
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
