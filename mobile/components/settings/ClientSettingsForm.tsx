import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, useRef, forwardRef, useImperativeHandle} from "react";
import {User, ClientProfile} from "@/types/global";
import {PhoneField, toE164} from "./PhoneField";

interface ClientSettingsFormProps {
  user: User;
  profile: ClientProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

export interface ClientSettingsFormHandle {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

const ClientSettingsFormComponent = forwardRef<ClientSettingsFormHandle, ClientSettingsFormProps>(
  ({user, profile, onSave, isLoading}, ref) => {
  const {colors} = useThemeVariant();

  const [firstName, setFirstName] = useState((user as any).firstName || (user as any).first_name || "");
  const [lastName, setLastName] = useState((user as any).lastName || (user as any).last_name || "");
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");

  // Snapshot of values at last save / mount — used for dirty detection
  const baseline = useRef({
    firstName: (user as any).firstName || (user as any).first_name || "",
    lastName: (user as any).lastName || (user as any).last_name || "",
    phone: user.phone || "",
    username: user.username || "",
  });
  
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
    const fn = (user as any).firstName || (user as any).first_name || "";
    const ln = (user as any).lastName || (user as any).last_name || "";
    const ph = user.phone || "";
    const un = user.username || "";
    setFirstName(fn);
    setLastName(ln);
    setEmail(user.email);
    setPhone(ph);
    setUsername(un);
    // Reset baseline when user data reloads from server
    baseline.current = {firstName: fn, lastName: ln, phone: ph, username: un};
  }, [
    user.email,
    user.phone,
    user.username,
    (user as any).firstName,
    (user as any).first_name,
    (user as any).lastName,
    (user as any).last_name,
  ]);

  const isDirty = () => {
    const b = baseline.current;
    return (
      firstName.trim() !== b.firstName.trim() ||
      lastName.trim() !== b.lastName.trim() ||
      toE164(phone) !== toE164(b.phone) ||
      username.trim() !== b.username.trim()
    );
  };

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
      phone: toE164(phone),   // strip "CA|" prefix — backend receives plain "+1 5551234567"
      username: trimmedUsername,
    };

    const profileData = {};

    await onSave(userData, profileData);
    // After a successful save, advance baseline so isDirty() → false
    baseline.current = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      username: trimmedUsername,
    };
  };

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty,
  }));

  return (
    <View style={styles.container}>
      {/* Personal Information Section */}
      <View style={styles.section}>
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
          <Text style={[styles.label, {color: colors.foreground}]}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.muted, borderColor: colors.border, opacity: 0.7},
            ]}>
            <Ionicons name="mail-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.mutedForeground}]}
              value={email}
              editable={false}
              placeholder="tu@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
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
          <Text style={[styles.label, {color: colors.foreground}]}>Teléfono</Text>
          <PhoneField value={phone} onChange={setPhone} />
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
