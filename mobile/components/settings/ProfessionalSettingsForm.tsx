import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect} from "react";
import {User, ProfessionalProfile} from "@/types/global";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {profileCustomizationApi} from "@/lib/api";

interface ProfessionalSettingsFormProps {
  user: User;
  profile: ProfessionalProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

export const ProfessionalSettingsForm = ({
  user,
  profile,
  onSave,
  isLoading,
}: ProfessionalSettingsFormProps) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState(profile?.bio || "");
  const [city, setCity] = useState(profile?.city || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(true);

  // Load public profile to get categories and subcategories
  useEffect(() => {
    const loadPublicProfile = async () => {
      try {
        setIsLoadingPublicProfile(true);
        const response = await profileCustomizationApi.getProfileImages();
        if (response?.data) {
          const publicProfile = response.data;
          // Handle both array and single value formats
          const categories = Array.isArray(publicProfile.category)
            ? publicProfile.category
            : publicProfile.category
            ? [publicProfile.category]
            : [];
          const subcategories = Array.isArray(publicProfile.sub_categories)
            ? publicProfile.sub_categories
            : publicProfile.sub_categories
            ? [publicProfile.sub_categories]
            : [];
          setSelectedCategories(categories);
          setSelectedSubcategories(subcategories);
          // Load display_name from public profile
          if (publicProfile.display_name) {
            setDisplayName(publicProfile.display_name);
          }
          console.log("Loaded categories:", categories);
          console.log("Loaded subcategories:", subcategories);
        }
      } catch (error) {
        console.error("Error loading public profile:", error);
      } finally {
        setIsLoadingPublicProfile(false);
      }
    };
    loadPublicProfile();
  }, []);

  // Initialize form fields only once when component mounts
  useEffect(() => {
    if (!isInitialized) {
      console.log("ProfessionalSettingsForm - User data:", user);
      console.log("ProfessionalSettingsForm - Profile data:", profile);

      setEmail(user.email);
      setPhone(user.phone || "");
      setUsername(user.username || "");
      setBio(profile?.bio || "");
      setCity(profile?.city || "");
      setIsInitialized(true);
    }
  }, [
    user.email,
    user.phone,
    user.username,
    profile?.bio,
    profile?.city,
    isInitialized,
  ]);

  const handleSave = async () => {
    const userData = {
      email,
      phone,
      username,
    };

    const profileData = {
      bio,
      city,
    };

    console.log("Saving profile data:", profileData);
    console.log("Saving user data:", userData);

    await onSave(userData, profileData);

    // Update public profile with categories, subcategories, and display_name
    try {
      const publicProfileData: any = {
        category: selectedCategories,
        sub_categories: selectedSubcategories,
      };
      // Update name and last_name (which control display_name for professionals) if displayName is provided
      if (displayName && displayName.trim()) {
        const nameParts = displayName.trim().split(' ');
        publicProfileData.name = nameParts[0] || displayName.trim();
        if (nameParts.length > 1) {
          publicProfileData.last_name = nameParts.slice(1).join(' ');
        } else {
          publicProfileData.last_name = '';
        }
      }
      await profileCustomizationApi.updatePublicProfile(publicProfileData);
      console.log("Public profile updated successfully");
    } catch (error) {
      console.error("Error updating public profile:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Professional Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Información Profesional
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre de Usuario</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="person-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={username}
              onChangeText={setUsername}
              placeholder="Tu nombre de usuario"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, {color: colors.foreground}]}>Nombre para mostrar</Text>
          <View
            style={[
              styles.inputContainer,
              {backgroundColor: colors.card, borderColor: colors.border},
            ]}>
            <Ionicons name="at-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            Este es el nombre que verán otros usuarios en tu perfil público
          </Text>
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
              placeholder="Cuéntanos sobre tu experiencia profesional..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
            <Ionicons name="location-outline" color={colors.mutedForeground} size={18} />
            <TextInput
              style={[styles.input, {color: colors.foreground}]}
              value={city}
              onChangeText={setCity}
              placeholder="Ciudad donde trabajas"
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
              placeholder="+1234567890"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pricetags" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>
            Categorías y Servicios
          </Text>
        </View>
        {!isLoadingPublicProfile && (
          <MultiCategorySelector
            selectedCategories={selectedCategories}
            selectedSubCategories={selectedSubcategories}
            onCategoriesChange={setSelectedCategories}
            onSubCategoriesChange={setSelectedSubcategories}
          />
        )}
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
  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
