import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image, Alert, ActivityIndicator} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, forwardRef, useImperativeHandle} from "react";
import {User, ClientProfile} from "@/types/global";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import {AddressSearch} from "@/components/location/AddressSearch";

interface ClientSettingsFormProps {
  user: User;
  profile: ClientProfile | null;
  onSave: (userData: any, profileData: any) => Promise<void>;
  isLoading: boolean;
}

const ClientSettingsFormComponent = forwardRef<{save: () => Promise<void>}, ClientSettingsFormProps>(
  ({user, profile, onSave, isLoading}, ref) => {
  const colorScheme = useColorScheme();
  const {colors} = useThemeVariant();

  const [firstName, setFirstName] = useState((user as any).firstName || (user as any).first_name);
  const [lastName, setLastName] = useState((user as any).lastName || (user as any).last_name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [username, setUsername] = useState(user.username || "");
  // For CLIENTs there is no PublicProfile.display_name; treat "display name" as first+last name.
  const [displayName, setDisplayName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>((user as any).image || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [location, setLocation] = useState<{latitude: number; longitude: number; address?: string} | null>(null);
  
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
    setProfilePhoto((user as any).image || null);
    const fn = ((user as any).firstName || (user as any).first_name || "").trim();
    const ln = ((user as any).lastName || (user as any).last_name || "").trim();
    setDisplayName(`${fn}${fn && ln ? " " : ""}${ln}`.trim());
    // Load saved location/address from user (not profile)
    const userAddress = (user as any).address;
    const userLat = (user as any).latitude;
    const userLng = (user as any).longitude;
    
    if (userLat && userLng) {
      setLocation({
        latitude: Number(userLat),
        longitude: Number(userLng),
        address: userAddress || undefined,
      });
    } else if (userAddress) {
      // If we have an address but no coordinates, create a location object
      // with the address so it displays in the input field
      // Coordinates will be set when user selects from autocomplete
      setLocation({
        latitude: Number(userLat) || 0,
        longitude: Number(userLng) || 0,
        address: userAddress,
      });
    }
  }, [
    user.email,
    user.phone,
    user.username,
    (user as any).firstName,
    (user as any).first_name,
    (user as any).lastName,
    (user as any).last_name,
    (user as any).image,
    (user as any).address,
    (user as any).latitude,
    (user as any).longitude,
  ]);

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
              await profileCustomizationApi.updatePublicProfile({delete_photo: true});
              setProfilePhoto(null);
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
      // Address and coordinates are now stored in User model
      ...(location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || undefined,
            country: location.country || undefined,
          }
        : {}),
    };

    const profileData = {}; // ClientProfile no longer stores address/coordinates

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
              ) : profilePhoto ? (
                <Image 
                  key={profilePhoto}
                  source={{uri: profilePhoto}} 
                  style={styles.profilePhoto}
                  onError={(e) => {
                    console.error("Error loading profile photo:", profilePhoto);
                    console.error("Image error event:", e.nativeEvent);
                  }}
                  onLoad={() => {
                    console.log("Profile photo loaded successfully:", profilePhoto);
                  }}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" color={colors.mutedForeground} size={40} />
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
            Toca la imagen para cambiar tu foto de perfil
          </Text>
        </View>
      </View>

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
              setLocation(selectedLocation);
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
  photoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  photoWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  photoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  deletePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
});
