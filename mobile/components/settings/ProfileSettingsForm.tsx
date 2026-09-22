import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, useRef, forwardRef, useImperativeHandle} from "react";
import {User, ClientProfile, ProfessionalProfile} from "@/types/global";
import {PhoneField, toE164} from "./PhoneField";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {profileCustomizationApi} from "@/lib/api";
import {AddressSearch} from "@/components/location/AddressSearch";

type UserRole = "CLIENT" | "PROFESSIONAL" | "PLACE";

interface ProfileSettingsFormProps {
  user: User;
  profile: ClientProfile | ProfessionalProfile | null;
  role: UserRole;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

export interface ProfileSettingsFormHandle {
  save: () => Promise<void>;
  isDirty: () => boolean;
}

const normalizeCategoryData = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === "string" && data[0].startsWith("[") && data[0].endsWith("]")) {
      try {
        const parsed = JSON.parse(data[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    if (data.every((item: any) => typeof item === "string")) return data;
  }
  if (typeof data === "string") {
    try {
      if (data.startsWith("[")) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } else {
        return [data];
      }
    } catch {
      return [data];
    }
  }
  return [];
};

export const ProfileSettingsForm = forwardRef<ProfileSettingsFormHandle, ProfileSettingsFormProps>(
  ({user, profile, role, onSave, isLoading}, ref) => {
    const {colors} = useThemeVariant();
    const isPro = role === "PROFESSIONAL" || role === "PLACE";

    // Common fields
    const [username, setUsername] = useState((user as any).username || "");
    const [email, setEmail] = useState(user.email || "");
    const [phone, setPhone] = useState(user.phone || "");

    // Client-only fields
    const [firstName, setFirstName] = useState(
      (user as any).firstName || (user as any).first_name || ""
    );
    const [lastName, setLastName] = useState(
      (user as any).lastName || (user as any).last_name || ""
    );

    // Pro-only fields
    const [bio, setBio] = useState((profile as any)?.bio || "");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [location, setLocation] = useState<{latitude: number; longitude: number; address?: string} | null>(null);
    const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(isPro);

    // Dirty tracking
    const baseline = useRef<Record<string, any>>({});

    const formatUsername = (text: string): string => {
      return text.replace(/\s/g, "").replace(/^@+/, "");
    };

    // Load public profile data for professionals
    useEffect(() => {
      if (!isPro) return;
      const loadPublicProfile = async () => {
        try {
          setIsLoadingPublicProfile(true);
          const response = await profileCustomizationApi.getProfileImages();
          if (response?.data) {
            const pp = response.data;
            setSelectedCategories(normalizeCategoryData(pp.category));
            setSelectedSubcategories(normalizeCategoryData(pp.sub_categories));
            if (pp.latitude && pp.longitude) {
              const addr = [pp.street, pp.city, pp.country].filter(Boolean).join(", ");
              setLocation({
                latitude: Number(pp.latitude),
                longitude: Number(pp.longitude),
                address: addr || undefined,
              });
            }
          }
        } catch (err) {
          console.error("Error loading public profile:", err);
        } finally {
          setIsLoadingPublicProfile(false);
        }
      };
      loadPublicProfile();
    }, [isPro]);

    // Sync state when user/profile changes
    useEffect(() => {
      const fn = (user as any).firstName || (user as any).first_name || "";
      const ln = (user as any).lastName || (user as any).last_name || "";
      const ph = user.phone || "";
      const un = (user as any).username || "";
      const em = user.email || "";

      setFirstName(fn);
      setLastName(ln);
      setPhone(ph);
      setUsername(un);
      setEmail(em);
      if (profile) setBio((profile as any).bio || "");

      baseline.current = {firstName: fn, lastName: ln, phone: ph, username: un, email: em};
    }, [user, profile]);

    const isDirty = () => {
      const b = baseline.current;
      if (isPro) {
        return (
          username.trim() !== (b.username || "").trim() ||
          email.trim() !== (b.email || "").trim() ||
          toE164(phone) !== toE164(b.phone || "")
        );
      }
      return (
        firstName.trim() !== (b.firstName || "").trim() ||
        lastName.trim() !== (b.lastName || "").trim() ||
        toE164(phone) !== toE164(b.phone || "") ||
        username.trim() !== (b.username || "").trim()
      );
    };

    const handleSave = async () => {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        Alert.alert("Error", "El nombre de usuario no puede estar vacío");
        return;
      }

      const userData: any = {
        email,
        phone: toE164(phone),
        username: trimmedUsername,
      };

      if (!isPro) {
        userData.firstName = firstName;
        userData.lastName = lastName;
      }

      if (isPro && location?.address) {
        userData.address = location.address;
        if (location.latitude != null && location.longitude != null) {
          userData.latitude = location.latitude;
          userData.longitude = location.longitude;
        }
      }

      const profileData: any = isPro
        ? {bio, category: selectedCategories, sub_categories: selectedSubcategories}
        : {};

      if (isPro) {
        const publicProfileData: any = {
          category: selectedCategories,
          sub_categories: selectedSubcategories,
        };
        if (location) {
          publicProfileData.latitude = location.latitude;
          publicProfileData.longitude = location.longitude;
          if (location.address) publicProfileData.street = location.address;
        }
        try {
          await profileCustomizationApi.updatePublicProfile(publicProfileData);
        } catch {
          Alert.alert("Error", "No se pudieron guardar las categorías.");
        }
      }

      await onSave(userData, profileData);

      baseline.current = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone,
        username: trimmedUsername,
        email,
      };
    };

    useImperativeHandle(ref, () => ({save: handleSave, isDirty}));

    return (
      <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, {color: colors.foreground}]}>Nombre de Usuario</Text>
            <View style={[styles.inputContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.atSymbol, {color: colors.mutedForeground}]}>@</Text>
              <TextInput
                style={[styles.input, {color: colors.foreground}]}
                value={username}
                onChangeText={(t) => setUsername(formatUsername(t))}
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
            <View style={[styles.inputContainer, {backgroundColor: colors.muted, borderColor: colors.border, opacity: 0.7}]}>
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
            <View style={[styles.inputContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
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
            <View style={[styles.inputContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
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

        {/* Bio — pro only */}
        {isPro && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Biografía</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Ionicons name="document-text-outline" color={colors.mutedForeground} size={18} style={styles.textAreaIcon} />
              <TextInput
                style={[styles.input, styles.textArea, {color: colors.foreground}]}
                value={bio}
                onChangeText={setBio}
                placeholder="Describe tus servicios..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* Categories — pro only */}
        {isPro && !isLoadingPublicProfile && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Categorías y Servicios</Text>
            <MultiCategorySelector
              selectedCategories={selectedCategories}
              selectedSubCategories={selectedSubcategories}
              onCategoriesChange={setSelectedCategories}
              onSubCategoriesChange={setSelectedSubcategories}
            />
          </View>
        )}

        {/* Location — pro only */}
        {isPro && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Ubicación</Text>
            <View style={styles.formGroup}>
              <Text style={[styles.label, {color: colors.foreground}]}>Dirección</Text>
              <AddressSearch
                placeholder="Buscar dirección..."
                value={location?.address}
                onSelect={(loc) => setLocation(loc)}
              />
              {location?.address && (
                <View style={[styles.locationInfo, {backgroundColor: colors.card, borderColor: colors.border}]}>
                  <Text style={[styles.locationInfoText, {color: colors.mutedForeground}]}>
                    {location.address}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }
);

ProfileSettingsForm.displayName = "ProfileSettingsForm";

const styles = StyleSheet.create({
  container: {flex: 1},
  section: {marginBottom: 24},
  sectionTitle: {fontSize: 16, fontWeight: "700", marginBottom: 14},
  formGroup: {marginBottom: 16},
  label: {fontSize: 14, fontWeight: "600", marginBottom: 8},
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4},
      android: {elevation: 2},
    }),
  },
  textAreaContainer: {alignItems: "flex-start", paddingVertical: 12},
  textAreaIcon: {marginTop: 4},
  input: {flex: 1, paddingVertical: 14, fontSize: 15},
  atSymbol: {fontSize: 15, fontWeight: "600", marginRight: 4},
  textArea: {minHeight: 100, paddingTop: 0},
  helperText: {fontSize: 12, marginTop: 4, fontStyle: "italic"},
  locationInfo: {marginTop: 8, padding: 12, borderRadius: 8, borderWidth: 1},
  locationInfoText: {fontSize: 14, fontWeight: "600"},
});
