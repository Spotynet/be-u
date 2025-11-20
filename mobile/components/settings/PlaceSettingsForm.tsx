import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {User, PlaceProfile} from "@/types/global";

interface PlaceSettingsFormProps {
  user: User;
  profile: PlaceProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

export const PlaceSettingsForm = ({user, profile, onSave, isLoading}: PlaceSettingsFormProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [street, setStreet] = useState(profile?.street || "");
  const [numberExt, setNumberExt] = useState(profile?.number_ext || "");
  const [numberInt, setNumberInt] = useState(profile?.number_int || "");
  const [postalCode, setPostalCode] = useState(profile?.postal_code || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "");

  useEffect(() => {
    setEmail(user.email);
    setPhone(user.phone || "");
    setName(profile?.name || "");
    setBio(profile?.bio || "");
    setStreet(profile?.street || "");
    setNumberExt(profile?.number_ext || "");
    setNumberInt(profile?.number_int || "");
    setPostalCode(profile?.postal_code || "");
    setCity(profile?.city || "");
    setCountry(profile?.country || "");
  }, [
    user.email,
    user.phone,
    profile?.name,
    profile?.bio,
    profile?.street,
    profile?.number_ext,
    profile?.number_int,
    profile?.postal_code,
    profile?.city,
    profile?.country,
  ]);

  const handleSave = async () => {
    const userData = {
      email,
      phone,
    };

    const profileData = {
      name,
      bio,
      street,
      number_ext: numberExt,
      number_int: numberInt,
      postal_code: postalCode,
      city,
      country,
    };

    await onSave(userData, profileData);
  };

  return (
    <View style={styles.container}>
      {/* Business Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Información del Negocio
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre del Establecimiento</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="storefront-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de tu negocio"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Biografía</Text>
          <View
            style={[
              styles.inputContainer,
              styles.textAreaContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons
              name="document-text-outline"
              color={colors.mutedForeground}
              size={18}
              style={styles.textAreaIcon}
            />
            <TextInput
              style={[styles.input, styles.textArea, {color: colors.foreground}]}
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos sobre tu negocio y servicios..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Email del Negocio</Text>
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
              placeholder="contacto@negocio.com"
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
              placeholder="+1234567890"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Ubicación</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Calle</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="navigate-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={street}
              onChangeText={setStreet}
              placeholder="Nombre de la calle"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.label, {color: colors.foreground}]}>Número Ext.</Text>
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Ionicons name="home-outline" color={colors.mutedForeground} size={18} />
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                value={numberExt}
                onChangeText={setNumberExt}
                placeholder="123"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={[styles.label, {color: colors.foreground}]}>Número Int.</Text>
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Ionicons name="home-outline" color={colors.mutedForeground} size={18} />
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                value={numberInt}
                onChangeText={setNumberInt}
                placeholder="A"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Código Postal</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="mail-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="12345"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Ciudad</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="business-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={city}
              onChangeText={setCity}
              placeholder="Ciudad"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>País</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="earth-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={country}
              onChangeText={setCountry}
              placeholder="País"
              placeholderTextColor={colors.mutedForeground}
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 0,
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
