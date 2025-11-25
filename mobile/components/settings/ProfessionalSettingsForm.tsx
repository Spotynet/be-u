import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image, Alert, ActivityIndicator} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, forwardRef, useImperativeHandle} from "react";
import {User, ProfessionalProfile} from "@/types/global";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";

// Helper function to normalize category/subcategory data from API
const normalizeCategoryData = (data: any): string[] => {
  if (!data) return [];
  
  // If it's already a proper array of strings
  if (Array.isArray(data) && data.length > 0) {
    // Check if first element is a stringified JSON array
    if (typeof data[0] === 'string' && data[0].startsWith('[') && data[0].endsWith(']')) {
      try {
        const parsed = JSON.parse(data[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // If parsing fails, continue with normal processing
      }
    }
    // Return the array as is if all elements are strings
    if (data.every((item: any) => typeof item === 'string')) {
      return data;
    }
  }
  
  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      if (data.startsWith('[')) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } else {
        return [data];
      }
    } catch (e) {
      return [data];
    }
  }
  
  return [];
};

interface ProfessionalSettingsFormProps {
  user: User;
  profile: ProfessionalProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

const ProfessionalSettingsFormComponent = forwardRef<{save: () => Promise<void>}, ProfessionalSettingsFormProps>(
  ({user, profile, onSave, isLoading}, ref) => {
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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load public profile to get categories and subcategories
  useEffect(() => {
    const loadPublicProfile = async () => {
      try {
        setIsLoadingPublicProfile(true);
        const response = await profileCustomizationApi.getProfileImages();
        if (response?.data) {
          const publicProfile = response.data;
          
          // Normalize category and subcategory data
          const categories = normalizeCategoryData(publicProfile.category);
          const subcategories = normalizeCategoryData(publicProfile.sub_categories);
          
          setSelectedCategories(categories);
          setSelectedSubcategories(subcategories);
          // Load display_name from public profile
          if (publicProfile.display_name) {
            setDisplayName(publicProfile.display_name);
          }
          // Load profile photo
          if (publicProfile.user_image) {
            setProfilePhoto(publicProfile.user_image);
          }
          console.log("📋 Raw category from API:", publicProfile.category);
          console.log("📋 Parsed categories:", categories);
          console.log("📋 Raw sub_categories from API:", publicProfile.sub_categories);
          console.log("📋 Parsed subcategories:", subcategories);
        }
      } catch (error) {
        console.error("Error loading public profile:", error);
      } finally {
        setIsLoadingPublicProfile(false);
      }
    };
    loadPublicProfile();
  }, []);

  const requestPermissions = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permisos requeridos", "Necesitamos acceso a tu galería para subir imágenes.", [
        {text: "OK"},
      ]);
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        const formData = new FormData();

        if (Platform.OS === "web") {
          // On web, convert URI to Blob/File object
          const res = await fetch(result.assets[0].uri);
          const blob = await res.blob();
          const mimeType = blob.type || "image/jpeg";
          const ext = (mimeType.split("/")[1] || "jpg").replace("jpeg", "jpg");
          const file = new File([blob], `profile_photo_${Date.now()}.${ext}`, {type: mimeType});
          formData.append("photo", file);
        } else {
          // On native, use the React Native file descriptor
          const uriParts = result.assets[0].uri.split(".");
          const fileType = uriParts[uriParts.length - 1] || "jpg";
          const rnFile = {
            uri: result.assets[0].uri,
            type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
            name: `profile_photo_${Date.now()}.${fileType}`,
          } as any;
          formData.append("photo", rnFile);
        }

        const response = await profileCustomizationApi.uploadProfilePhoto(formData);
        if (response.data.user_image) {
          setProfilePhoto(response.data.user_image);
          Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
        }
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        Alert.alert("Error", "No se pudo subir la foto de perfil. Inténtalo de nuevo.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

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

  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  return (
    <View style={styles.container}>
      {/* Profile Photo Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="camera" color={colors.primary} size={20} />
          <Text style={[styles.sectionTitle, {color: colors.foreground}]}>Foto de Perfil</Text>
        </View>

        <View style={styles.photoContainer}>
          <TouchableOpacity
            style={[styles.photoButton, {backgroundColor: colors.card, borderColor: colors.border}]}
            onPress={pickImage}
            disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : profilePhoto ? (
              <Image source={{uri: profilePhoto}} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" color={colors.mutedForeground} size={40} />
                <Text style={[styles.photoPlaceholderText, {color: colors.mutedForeground}]}>
                  Agregar foto
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            Toca la imagen para cambiar tu foto de perfil
          </Text>
        </View>
      </View>

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

    </View>
  );
});

ProfessionalSettingsFormComponent.displayName = "ProfessionalSettingsForm";

export const ProfessionalSettingsForm = ProfessionalSettingsFormComponent;

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
  photoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  photoPlaceholderText: {
    fontSize: 12,
    textAlign: "center",
  },
});
