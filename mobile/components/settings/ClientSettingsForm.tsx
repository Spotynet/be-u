import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {User, ClientProfile} from "@/types/global";

interface ClientSettingsFormProps {
  user: User;
  profile: ClientProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

export const ClientSettingsForm = ({user, profile, onSave, isLoading}: ClientSettingsFormProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const [firstName, setFirstName] = useState((user as any).firstName || (user as any).first_name);
  const [lastName, setLastName] = useState((user as any).lastName || (user as any).last_name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");

  useEffect(() => {
    setFirstName((user as any).firstName || (user as any).first_name);
    setLastName((user as any).lastName || (user as any).last_name);
    setEmail(user.email);
    setPhone(user.phone || "");
  }, [
    user.email,
    user.phone,
    (user as any).firstName,
    (user as any).first_name,
    (user as any).lastName,
    (user as any).last_name,
  ]);

  const handleSave = async () => {
    const userData = {
      firstName,
      lastName,
      email,
      phone,
    };

    const profileData = {};

    await onSave(userData, profileData);
  };

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
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, {backgroundColor: colors.primary}]}
        onPress={handleSave}
        disabled={isLoading}
        activeOpacity={0.9}>
        {isLoading ? (
          <Text style={styles.saveButtonText}>Guardando...</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle" color="#ffffff" size={20} />
            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

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
});
