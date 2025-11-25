import {View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image, Alert, ActivityIndicator} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState, useEffect, forwardRef, useImperativeHandle} from "react";
import {User, ClientProfile} from "@/types/global";
import {profileCustomizationApi} from "@/lib/api";
import * as ImagePicker from "expo-image-picker";

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
  const [profilePhoto, setProfilePhoto] = useState<string | null>((user as any).image || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setFirstName((user as any).firstName || (user as any).first_name);
    setLastName((user as any).lastName || (user as any).last_name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setProfilePhoto((user as any).image || null);
  }, [
    user.email,
    user.phone,
    (user as any).firstName,
    (user as any).first_name,
    (user as any).lastName,
    (user as any).last_name,
    (user as any).image,
  ]);

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
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
