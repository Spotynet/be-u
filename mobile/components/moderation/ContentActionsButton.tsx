import {Alert, Platform, TouchableOpacity} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth";
import {errorUtils, moderationApi} from "@/lib/api";

export type ReportTargetType = "post" | "comment" | "review" | "profile";

const REASONS: {key: string; label: string}[] = [
  {key: "spam", label: "Spam"},
  {key: "acoso", label: "Acoso"},
  {key: "inapropiado", label: "Contenido inapropiado"},
  {key: "estafa", label: "Estafa"},
  {key: "otro", label: "Otro"},
];

type OpenArgs = {
  targetType: ReportTargetType;
  targetId: number;
  authorUserId?: number | null;
  isAuthenticated: boolean;
  onNeedLogin: () => void;
  onBlocked?: (userId: number) => void;
};

async function sendReport(args: OpenArgs, reason: string, note: string) {
  try {
    await moderationApi.report({
      target_type: args.targetType,
      target_id: args.targetId,
      reason,
      note,
    });
    Alert.alert("Reporte enviado", "Gracias. Revisaremos este contenido.");
  } catch (error) {
    Alert.alert("Error", errorUtils.getErrorMessage(error));
  }
}

function askNote(args: OpenArgs, reason: string) {
  if (Platform.OS === "ios" && typeof Alert.prompt === "function") {
    Alert.prompt(
      "Detalle opcional",
      "Puedes agregar un comentario para el equipo.",
      [
        {text: "Omitir", style: "cancel", onPress: () => sendReport(args, reason, "")},
        {text: "Enviar", onPress: (text?: string) => sendReport(args, reason, text || "")},
      ],
      "plain-text"
    );
    return;
  }
  sendReport(args, reason, "");
}

export function openContentActions(args: OpenArgs) {
  if (!args.isAuthenticated) {
    Alert.alert("Inicia sesión", "Necesitas una cuenta para reportar o bloquear.", [
      {text: "Cancelar", style: "cancel"},
      {text: "Iniciar sesión", onPress: args.onNeedLogin},
    ]);
    return;
  }

  const buttons: {text: string; style?: "cancel" | "destructive"; onPress?: () => void}[] = [
    {
      text: "Reportar",
      onPress: () => {
        Alert.alert(
          "¿Por qué reportas esto?",
          undefined,
          [
            ...REASONS.map((reason) => ({
              text: reason.label,
              onPress: () => askNote(args, reason.key),
            })),
            {text: "Cancelar", style: "cancel" as const},
          ]
        );
      },
    },
  ];

  if (args.authorUserId) {
    buttons.push({
      text: "Bloquear",
      style: "destructive",
      onPress: () => {
        Alert.alert(
          "Bloquear usuario",
          "Dejarás de ver su contenido. Esta persona tampoco verá el tuyo.",
          [
            {text: "Cancelar", style: "cancel"},
            {
              text: "Bloquear",
              style: "destructive",
              onPress: async () => {
                try {
                  await moderationApi.blockUser(args.authorUserId as number);
                  args.onBlocked?.(args.authorUserId as number);
                  Alert.alert("Usuario bloqueado", "Su contenido ya no aparecerá en tu cuenta.");
                } catch (error) {
                  Alert.alert("Error", errorUtils.getErrorMessage(error));
                }
              },
            },
          ]
        );
      },
    });
  }

  buttons.push({text: "Cancelar", style: "cancel"});
  Alert.alert("Opciones", undefined, buttons);
}

export function ContentActionsButton({
  targetType,
  targetId,
  authorUserId,
  color,
  size = 20,
  onBlocked,
}: {
  targetType: ReportTargetType;
  targetId: number;
  authorUserId?: number | null;
  color: string;
  size?: number;
  onBlocked?: (userId: number) => void;
}) {
  const {user, isAuthenticated} = useAuth();
  const router = useRouter();
  const viewerId = user?.id;
  if (!targetId || (authorUserId && viewerId && Number(authorUserId) === Number(viewerId))) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() =>
        openContentActions({
          targetType,
          targetId,
          authorUserId,
          isAuthenticated,
          onNeedLogin: () => router.push("/login"),
          onBlocked,
        })
      }
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
      <Ionicons name="ellipsis-vertical" size={size} color={color} />
    </TouchableOpacity>
  );
}
