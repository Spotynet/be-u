import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, forwardRef, useImperativeHandle} from "react";
import {User, ClientProfile} from "@/types/global";

interface ClientSettingsFormProps {
  user: User;
  profile: ClientProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

const ClientSettingsFormComponent = forwardRef<{save: () => Promise<void>}, ClientSettingsFormProps>(
  ({user, profile, onSave, isLoading}, ref) => {
  const {colors} = useThemeVariant();

  const [firstName, setFirstName] = useState((user as any).firstName || (user as any).first_name);
  const [lastName, setLastName] = useState((user as any).lastName || (user as any).last_name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");
  // For CLIENTs there is no PublicProfile.display_name; treat "display name" as first+last name.
  const [displayName, setDisplayName] = useState("");
  
  // Format username: remove spaces and ensure @ prefix
  const formatUsername = (text: string): string => {
    // Remove all spaces
    let formatted = text.replace(/\s/g, '');
    // Remove @ if user types it (we'll add it back)
    formatted = formatted.replace(/^@+/, '');
    return formatted;
  };
  
  const handleUsernameChange = (text: string) => {
    const formatted = formatUsername(text);
    setUsername(formatted);
  };

  useEffect(() => {
    setFirstName((user as any).firstName || (user as any).first_name);
    setLastName((user as any).lastName || (user as any).last_name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setUsername(user.username || "");
    const fn = ((user as any).firstName || (user as any).first_name || "").trim();
    const ln = ((user as any).lastName || (user as any).last_name || "").trim();
    setDisplayName(`${fn}${fn && ln ? " " : ""}${ln}`.trim());
  }, [
    user.email,
    user.phone,
    user.username,
    (user as any).firstName,
    (user as any).first_name,
    (user as any).lastName,
    (user as any).last_name,
  ]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      Alert.alert("Error", "El nombre de usuario no puede estar vacío");
      return;
    }

    const userData = {
      firstName,
      lastName,
      email,
      phone,
      username: trimmedUsername, // Ensure username is trimmed and saved
    };

    const profileData = {}; // ClientProfile no longer stores address/coordinates

    await onSave(userData, profileData);
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return (
    <View style={styles.container}>
      {/* Personal Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Información Personal
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="person-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Apellido</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="person-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Tu apellido"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="mail-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Teléfono</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="call-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+52 123 456 7890"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre de Usuario</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Text style={[styles.atSymbol, {color: colors.mutedForeground}]}>@</Text>
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="nombreusuario"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            Sin espacios. Solo letras, números y guiones bajos
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre para mostrar</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="text-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={displayName}
              onChangeText={(text) => {
                // Limit to 50 characters
                if (text.length <= 50) {
                  setDisplayName(text);
                  const parts = text.trim().split(/\s+/).filter(Boolean);
                  if (parts.length > 0) {
                    setFirstName(parts[0]);
                    setLastName(parts.slice(1).join(" "));
                  } else {
                    setFirstName("");
                    setLastName("");
                  }
                }
              }}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.mutedForeground}
              maxLength={50}
            />
          </View>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            Este es el nombre que verán otros usuarios en tu perfil público (máximo 50 caracteres)
          </Text>
        </View>
      </View>

    </View>
  );
});

ClientSettingsFormComponent.displayName = "ClientSettingsForm";

export const ClientSettingsForm = ClientSettingsFormComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  atSymbol: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
