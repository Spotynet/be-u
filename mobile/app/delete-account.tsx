import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";
import {useState} from "react";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {authApi, errorUtils} from "@/lib/api";
import {useAuth} from "@/features/auth/hooks/useAuth";
import {AppHeader} from "@/components/ui/AppHeader";

export default function DeleteAccountScreen() {
  const {colors} = useThemeVariant();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {logout} = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que deseas eliminar tu cuenta y todos los datos asociados? Esta acción no se puede deshacer.",
      [
        {text: "Cancelar", style: "cancel"},
        {text: "Eliminar", style: "destructive", onPress: confirmDelete},
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await authApi.deleteMyAccount();
      await logout();
      router.replace("/login");
    } catch (error: any) {
      const message = errorUtils.getErrorMessage(error);
      Alert.alert("Error", message || "No se pudo eliminar la cuenta.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[s.root, {backgroundColor: colors.contentBackground}]}>
      <AppHeader
        title="Eliminar cuenta"
        showBackButton
        onBackPress={() => !isDeleting && router.back()}
      />

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Icon + description card */}
        <View style={s.section}>
          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            <View style={s.iconRow}>
              <View style={[s.iconWrap, {backgroundColor: "#ef4444" + "18"}]}>
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
            </View>

            <Text style={[s.title, {color: colors.foreground}]}>
              ¿Eliminar tu cuenta?
            </Text>
            <Text style={[s.body, {color: colors.mutedForeground}]}>
              Se eliminarán permanentemente tu perfil, reservas, publicaciones y todos los datos asociados. Esta acción{" "}
              <Text style={s.bold}>no se puede deshacer.</Text>
            </Text>
          </View>
        </View>

        {/* What gets deleted */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, {backgroundColor: "#ef4444" + "18"}]}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
            </View>
            <Text style={[s.sectionTitle, {color: colors.foreground}]}>Se eliminará</Text>
          </View>

          <View style={[s.card, {backgroundColor: colors.card, borderColor: colors.border}]}>
            {[
              {icon: "person-outline", text: "Tu perfil e información personal"},
              {icon: "calendar-outline", text: "Historial de reservas"},
              {icon: "images-outline", text: "Publicaciones y contenido"},
              {icon: "star-outline", text: "Reseñas y valoraciones"},
              {icon: "heart-outline", text: "Favoritos guardados"},
            ].map((item, idx, arr) => (
              <View key={item.text}>
                <View style={s.listRow}>
                  <Ionicons name={item.icon as any} size={18} color={colors.mutedForeground} />
                  <Text style={[s.listText, {color: colors.foreground}]}>{item.text}</Text>
                </View>
                {idx < arr.length - 1 && (
                  <View style={[s.divider, {backgroundColor: colors.border}]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>

      <View
        style={[
          s.fixedFooter,
          {
            backgroundColor: colors.contentBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}>
        <TouchableOpacity
          style={[s.deleteBtn, {backgroundColor: isDeleting ? colors.muted : "#ef4444"}]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.85}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="trash" size={18} color="#ffffff" />
          )}
          <Text style={s.deleteBtnText}>
            {isDeleting ? "Eliminando..." : "Eliminar mi cuenta"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  scroll: {flex: 1},
  content: {paddingHorizontal: 16, paddingTop: 12},

  section: {marginBottom: 24},
  sectionHeader: {flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, paddingHorizontal: 2},
  sectionIcon: {width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center"},
  sectionTitle: {fontSize: 14, fontWeight: "700", letterSpacing: 0.1},

  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 6},
      android: {elevation: 2},
    }),
  },
  divider: {height: StyleSheet.hairlineWidth, marginHorizontal: 16},

  iconRow: {alignItems: "center", paddingTop: 28, paddingBottom: 16},
  iconWrap: {width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center"},
  title: {fontSize: 18, fontWeight: "700", textAlign: "center", paddingHorizontal: 20, marginBottom: 10},
  body: {fontSize: 14, lineHeight: 21, textAlign: "center", paddingHorizontal: 20, paddingBottom: 24},
  bold: {fontWeight: "700"},

  listRow: {flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13},
  listText: {fontSize: 14, flex: 1},

  fixedFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {shadowColor: "#000", shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.08, shadowRadius: 8},
      android: {elevation: 5},
    }),
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  deleteBtnText: {color: "#ffffff", fontSize: 16, fontWeight: "700"},

  bottomPad: {height: 16},
});
