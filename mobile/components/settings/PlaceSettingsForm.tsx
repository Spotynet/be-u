import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image, Alert, ActivityIndicator} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, forwardRef, useImperativeHandle} from "react";
import {User, PlaceProfile} from "@/types/global";
import {MultiCategorySelector} from "@/components/profile/MultiCategorySelector";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import {AddressSearch} from "@/components/location/AddressSearch";

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

interface PlaceSettingsFormProps {
  user: User;
  profile: PlaceProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

const PlaceSettingsFormComponent = forwardRef<{save: () => Promise<void>}, PlaceSettingsFormProps>(
  ({user, profile, onSave, isLoading}, ref) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");
  const [name, setName] = useState(profile?.name || "");
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
  const [bio, setBio] = useState(profile?.bio || "");
  const [street, setStreet] = useState(profile?.street || "");
  const [numberExt, setNumberExt] = useState(profile?.number_ext || "");
  const [numberInt, setNumberInt] = useState(profile?.number_int || "");
  const [postalCode, setPostalCode] = useState(profile?.postal_code || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [location, setLocation] = useState<{latitude: number; longitude: number; address?: string} | null>(null);

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
          if (publicProfile.latitude && publicProfile.longitude) {
            const addressParts = [publicProfile.street, publicProfile.city, publicProfile.country]
              .filter(Boolean)
              .join(", ");
            setLocation({
              latitude: Number(publicProfile.latitude),
              longitude: Number(publicProfile.longitude),
              address: addressParts || undefined,
            });
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
    // Web doesn't require media library permissions.
    if (Platform.OS === "web") return true;
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
        console.log("Profile photo upload response:", response.data);
        
        // After upload, reload the profile to get the updated image URL
        try {
          // Wait a bit for the backend to process the upload
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const profileResponse = await profileCustomizationApi.getProfileImages();
          console.log("Reloaded profile data:", profileResponse.data);
          console.log("user_image from profile:", profileResponse.data?.user_image);
          
          if (profileResponse.data?.user_image) {
            let url = profileResponse.data.user_image as string;
            
            // If URL is relative or has issues, try to fix it
            if (!url.startsWith('http')) {
              console.warn("Relative URL detected, attempting to fix:", url);
              // If it's a relative path, make it absolute
              if (url.startsWith('/')) {
                url = `${window.location.origin}${url}`;
              }
            }
            
            // Bust cache so the new photo shows immediately
            const cacheBustedUrl = url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url;
            console.log("Setting profile photo URL:", cacheBustedUrl);
            setProfilePhoto(cacheBustedUrl);
            setImageError(false);
            Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
          } else {
            console.warn("No user_image in reloaded profile:", profileResponse.data);
            Alert.alert("Advertencia", "La foto se subió pero no se pudo cargar. Intenta recargar la página.");
          }
        } catch (reloadError) {
          console.error("Error reloading profile after upload:", reloadError);
          // Try to use the response from upload if reload fails
          if (response.data.user_image) {
            let url = response.data.user_image as string;
            
            // Fix relative URLs
            if (!url.startsWith('http') && url.startsWith('/')) {
              url = `${window.location.origin}${url}`;
            }
            
            setProfilePhoto(url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url);
            setImageError(false);
            Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
          } else {
            Alert.alert("Advertencia", "La foto se subió pero no se pudo cargar. Intenta recargar la página.");
          }
        }
      } catch (error: any) {
        console.error("Error uploading profile photo:", error);
        console.error("Error response:", error?.response?.data);
        console.error("Error status:", error?.response?.status);
        const errorMessage = error?.response?.data?.photo?.[0] || 
                           error?.response?.data?.detail || 
                           error?.message || 
                           "No se pudo subir la foto de perfil. Inténtalo de nuevo.";
        Alert.alert("Error", errorMessage);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const deletePhoto = async () => {
    Alert.alert(
      "Eliminar foto de perfil",
      "¿Estás seguro de que deseas eliminar tu foto de perfil?",
      [
        {text: "Cancelar", style: "cancel"},
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              // Use dedicated delete endpoint
              await profileCustomizationApi.deleteProfilePhoto();
              
              setProfilePhoto(null);
              setImageError(false);
              Alert.alert("Éxito", "Foto de perfil eliminada correctamente");
            } catch (error) {
              console.error("Error deleting profile photo:", error);
              Alert.alert("Error", "No se pudo eliminar la foto de perfil. Inténtalo de nuevo.");
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

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
      phone: phone || "", // Always include phone, even if empty
      username: username.trim(), // Ensure username is trimmed and saved
    };
    
    // Save address to User model if location is provided
    if (location && location.address) {
      userData.address = location.address;
      if (location.latitude != null && location.longitude != null) {
        userData.latitude = location.latitude;
        userData.longitude = location.longitude;
      }
    }
    
    // Save city and country to User model
    if (city) {
      userData.city = city;
    }
    if (country) {
      userData.country = country;
    }

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

    // Always update public profile (category/sub_categories) first so it persists even if auth profile update fails
    const publicProfileData: any = {
      category: selectedCategories ?? [],
      sub_categories: selectedSubcategories ?? [],
    };
    if (location) {
      publicProfileData.latitude = location.latitude;
      publicProfileData.longitude = location.longitude;
    }
    // Save address fields to public profile for places
    if (street) {
      publicProfileData.street = street;
    }
    if (numberExt) {
      publicProfileData.number_ext = numberExt;
    }
    if (numberInt) {
      publicProfileData.number_int = numberInt;
    }
    if (postalCode) {
      publicProfileData.postal_code = postalCode;
    }
    if (city) {
      publicProfileData.city = city;
    }
    if (country) {
      publicProfileData.country = country;
    }
    if (displayName && displayName.trim() && displayName !== name) {
      publicProfileData.name = displayName.trim();
    }
    try {
      await profileCustomizationApi.updatePublicProfile(publicProfileData);
      console.log("Public profile (categories) updated successfully");
    } catch (error) {
      console.error("Error updating public profile:", error);
      Alert.alert("Error", "No se pudieron guardar las categorías. Intenta de nuevo.");
    }

    console.log("PlaceSettingsForm - Saving data:", {userData, profileData});
    await onSave(userData, profileData);
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
          <View style={styles.photoWrapper}>
            <TouchableOpacity
              style={[styles.photoButton, {backgroundColor: colors.card, borderColor: colors.border}]}
              onPress={pickImage}
              disabled={uploadingPhoto}>
              {uploadingPhoto ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : profilePhoto && !imageError ? (
                <Image 
                  key={profilePhoto}
                  source={{uri: profilePhoto}} 
                  style={styles.profilePhoto}
                  onError={(e) => {
                    console.error("Error loading profile photo:", profilePhoto);
                    console.error("Image error event:", e.nativeEvent);
                    setImageError(true);
                  }}
                  onLoad={() => {
                    console.log("Profile photo loaded successfully:", profilePhoto);
                    setImageError(false);
                  }}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="storefront" color={colors.mutedForeground} size={40} />
                  <Text style={[styles.photoPlaceholderText, {color: colors.mutedForeground}]}>
                    Agregar foto
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {profilePhoto && !uploadingPhoto && (
              <TouchableOpacity
                style={[styles.deletePhotoButton, {backgroundColor: colors.background}]}
                onPress={deletePhoto}>
                <Ionicons name="trash-outline" color="#ef4444" size={20} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            {profilePhoto ? "Toca la imagen para cambiar tu foto de perfil" : "Toca para agregar una foto de perfil"}
          </Text>
        </View>
      </View>

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
                }
              }}
              placeholder="Nombre que se mostrará en tu perfil público"
              placeholderTextColor={colors.mutedForeground}
              maxLength={50}
            />
          </View>
          <Text style={[styles.helperText, {color: colors.mutedForeground}]}>
            Este es el nombre que verán otros usuarios en tu perfil público (máximo 50 caracteres)
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
          <Text style={[styles.label, {color: colors.foreground}]}>Dirección</Text>
          <AddressSearch
            placeholder="Buscar dirección..."
            value={location?.address}
            onSelect={(selectedLocation) => {
              console.log("Location selected in PlaceSettingsForm:", selectedLocation);
              setLocation(selectedLocation);
              // Update street field when address is selected
              if (selectedLocation.address) {
                setStreet(selectedLocation.address);
              }
              // Update country if available
              if (selectedLocation.country) {
                setCountry(selectedLocation.country);
              }
            }}
          />
          {location && location.address && (
            <View style={[styles.locationInfo, {backgroundColor: colors.card, borderColor: colors.border}]}>
              <Text style={[styles.locationInfoText, {color: colors.mutedForeground}]}>
                {location.address}
              </Text>
            </View>
          )}
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

PlaceSettingsFormComponent.displayName = "PlaceSettingsForm";

export const PlaceSettingsForm = PlaceSettingsFormComponent;

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
  atSymbol: {
    fontSize: 15,
    fontWeight: "600",
    marginRight: 4,
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  locationInfo: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationInfoText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  photoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
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
  deletePhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ef4444",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
