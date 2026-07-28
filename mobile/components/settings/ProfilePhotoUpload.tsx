import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useEffect, useRef} from "react";
import {useThemeVariant} from "@/contexts/ThemeVariantContext";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ProfilePhotoUploadProps {
  photoUrl: string | null;
  status: UploadStatus;
  errorMessage?: string;
  onPress: () => void;
  onDelete?: () => void;
}

export function ProfilePhotoUpload({
  photoUrl,
  status,
  errorMessage,
  onPress,
  onDelete,
}: ProfilePhotoUploadProps) {
  const {colors} = useThemeVariant();

  // Pulse animation for spinner ring
  const spinAnim = useRef(new Animated.Value(0)).current;
  // Scale pop for success/error badge
  const badgeScale = useRef(new Animated.Value(0)).current;
  // Fade for overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === "uploading") {
      overlayOpacity.setValue(1);
      badgeScale.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else if (status === "success" || status === "error") {
      spinAnim.stopAnimation();
      Animated.parallel([
        Animated.spring(badgeScale, {toValue: 1, friction: 5, tension: 200, useNativeDriver: true}),
        Animated.timing(overlayOpacity, {toValue: 0.55, duration: 200, useNativeDriver: true}),
      ]).start();
    } else {
      spinAnim.stopAnimation();
      Animated.timing(overlayOpacity, {toValue: 0, duration: 200, useNativeDriver: true}).start();
      badgeScale.setValue(0);
    }
  }, [status]);

  const spin = spinAnim.interpolate({inputRange: [0, 1], outputRange: ["0deg", "360deg"]});

  const isUploading = status === "uploading";
  const isSuccess = status === "success";
  const isError = status === "error";
  const hasOverlay = isUploading || isSuccess || isError;

  return (
    <View style={s.root}>
      {/* Avatar circle */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isUploading}
        style={[s.avatar, {backgroundColor: colors.card, borderColor: isError ? colors.error : isSuccess ? colors.success : colors.border}]}>

        {/* Photo or placeholder */}
        {photoUrl ? (
          <Image source={{uri: photoUrl}} style={s.photo} />
        ) : (
          <View style={s.placeholder}>
            <Ionicons name="person" size={48} color={colors.mutedForeground} />
          </View>
        )}

        {/* Overlay (uploading / success / error) */}
        {hasOverlay && (
          <Animated.View style={[s.overlay, {opacity: overlayOpacity}]} />
        )}

        {/* Spinner ring while uploading */}
        {isUploading && (
          <View style={s.overlayContent} pointerEvents="none">
            <Animated.View style={{transform: [{rotate: spin}]}}>
              <Ionicons name="refresh" size={36} color="#fff" />
            </Animated.View>
          </View>
        )}

        {/* Success / error badge */}
        {(isSuccess || isError) && (
          <Animated.View style={[s.overlayContent, {transform: [{scale: badgeScale}]}]} pointerEvents="none">
            <View style={[s.badge, {backgroundColor: isSuccess ? colors.success : colors.error}]}>
              <Ionicons
                name={isSuccess ? "checkmark" : "close"}
                size={28}
                color="#fff"
              />
            </View>
          </Animated.View>
        )}

        {/* Camera icon badge (bottom-right) — only when idle */}
        {status === "idle" && (
          <View style={[s.cameraBadge, {backgroundColor: colors.primary, borderColor: colors.card}]}>
            <Ionicons name="camera" size={14} color={colors.primaryForeground} />
          </View>
        )}
      </TouchableOpacity>

      {/* Status label */}
      <View style={s.statusRow}>
        {isUploading && (
          <>
            <ActivityIndicator size="small" color={colors.primary} style={{marginRight: 6}} />
            <Text style={[s.statusText, {color: colors.mutedForeground}]}>Subiendo foto…</Text>
          </>
        )}
        {isSuccess && (
          <>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{marginRight: 4}} />
            <Text style={[s.statusText, {color: colors.success}]}>¡Foto actualizada!</Text>
          </>
        )}
        {isError && (
          <>
            <Ionicons name="alert-circle" size={16} color={colors.error} style={{marginRight: 4}} />
            <Text style={[s.statusText, {color: colors.error}]} numberOfLines={2}>
              {errorMessage || "Error al subir la foto"}
            </Text>
          </>
        )}
        {status === "idle" && (
          <Text style={[s.statusText, {color: colors.mutedForeground}]}>
            {photoUrl ? "Toca para cambiar foto" : "Toca para agregar foto"}
          </Text>
        )}
      </View>

      {/* Delete button — only when idle and has photo */}
      {status === "idle" && photoUrl && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.75}
          style={[s.deleteBtn, {backgroundColor: colors.errorBg, borderColor: colors.error + "50"}]}>
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={[s.deleteBtnText, {color: colors.error}]}>Eliminar foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const AVATAR = 120;

const s = StyleSheet.create({
  root: {alignItems: "center", paddingVertical: 8},
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {width: "100%", height: "100%"},
  placeholder: {width: "100%", height: "100%", justifyContent: "center", alignItems: "center"},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    borderRadius: AVATAR / 2,
  },
  overlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    minHeight: 22,
    paddingHorizontal: 8,
  },
  statusText: {fontSize: 13, fontWeight: "500", textAlign: "center"},
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  deleteBtnText: {fontSize: 13, fontWeight: "600"},
});
