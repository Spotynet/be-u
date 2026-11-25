/**
 * Spanish labels for notification preference keys.
 * Backend keys are never shown raw in the UI.
 */

export type PrefMeta = {
  label: string;
  description: string;
  /** Heroicons outline name key used by the section. */
  icon:
    | "bell"
    | "calendar"
    | "heart"
    | "chat"
    | "at"
    | "userPlus"
    | "star"
    | "mapPin"
    | "tag"
    | "megaphone"
    | "sparkles"
    | "envelope";
};

export const PREFERENCE_LABELS: Record<string, PrefMeta> = {
  channel_push: {
    label: "Notificaciones push",
    description: "Avisos en tu dispositivo",
    icon: "bell",
  },
  channel_email: {
    label: "Correo electrónico",
    description: "Avisos en tu bandeja de entrada",
    icon: "envelope",
  },
  booking_confirmed: {
    label: "Reserva confirmada",
    description: "Cuando un profesional o lugar confirma tu reserva",
    icon: "calendar",
  },
  booking_cancelled: {
    label: "Reserva cancelada",
    description: "Si una reserva se cancela o cambia",
    icon: "calendar",
  },
  booking_reminder: {
    label: "Recordatorios de reserva",
    description: "Un aviso antes de tu cita",
    icon: "calendar",
  },
  booking_new: {
    label: "Nueva solicitud de reserva",
    description: "Cuando un cliente solicita una cita",
    icon: "calendar",
  },
  social_like: {
    label: "Me gusta",
    description: "Cuando alguien reacciona a tu publicación",
    icon: "heart",
  },
  social_comment: {
    label: "Comentarios",
    description: "Cuando comentan tus publicaciones",
    icon: "chat",
  },
  social_mention: {
    label: "Menciones",
    description: "Cuando te mencionan",
    icon: "at",
  },
  social_follow: {
    label: "Nuevos seguidores",
    description: "Cuando alguien empieza a seguirte",
    icon: "userPlus",
  },
  social_saved: {
    label: "Guardados en favoritos",
    description: "Cuando alguien guarda tu perfil",
    icon: "heart",
  },
  review_reply: {
    label: "Respuestas a tus reseñas",
    description: "Cuando un negocio responde tu reseña",
    icon: "star",
  },
  review_new: {
    label: "Nueva reseña",
    description: "Cuando un cliente deja una reseña",
    icon: "star",
  },
  discover_nearby: {
    label: "Novedades cerca de ti",
    description: "Profesionales y lugares nuevos en tu zona",
    icon: "mapPin",
  },
  discover_offers: {
    label: "Ofertas y promociones cercanas",
    description: "Descuentos de negocios que te interesan",
    icon: "tag",
  },
  promo_news: {
    label: "Novedades de nabbi",
    description: "Nuevas funciones y anuncios",
    icon: "megaphone",
  },
  promo_tips: {
    label: "Consejos y recomendaciones",
    description: "Ideas para sacar más provecho de la app",
    icon: "sparkles",
  },
};

export type PrefGroupId =
  | "channels"
  | "bookings"
  | "social"
  | "discover"
  | "promo"
  | "other";

export type PrefGroupDef = {
  id: PrefGroupId;
  title: string;
  /** Ordered keys; only keys present in the draft are rendered. */
  keys: string[];
  showBulkToggle?: boolean;
};

/** Client-oriented grouping; unknown keys land in `other`. */
export const PREFERENCE_GROUPS: PrefGroupDef[] = [
  {
    id: "channels",
    title: "Cómo quieres recibir los avisos",
    keys: ["channel_push", "channel_email"],
    showBulkToggle: false,
  },
  {
    id: "bookings",
    title: "Reservas",
    keys: [
      "booking_confirmed",
      "booking_cancelled",
      "booking_reminder",
      "booking_new",
    ],
    showBulkToggle: true,
  },
  {
    id: "social",
    title: "Social",
    keys: [
      "social_like",
      "social_comment",
      "social_mention",
      "social_follow",
      "social_saved",
      "review_reply",
      "review_new",
    ],
    showBulkToggle: true,
  },
  {
    id: "discover",
    title: "Descubrimiento",
    keys: ["discover_nearby", "discover_offers"],
    showBulkToggle: true,
  },
  {
    id: "promo",
    title: "Promociones de nabbi",
    keys: ["promo_news", "promo_tips"],
    showBulkToggle: true,
  },
];

export function humanizePrefKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolvePrefMeta(key: string): PrefMeta {
  return (
    PREFERENCE_LABELS[key] ?? {
      label: humanizePrefKey(key),
      description: "Preferencia de avisos",
      icon: "bell",
    }
  );
}

/** Keys returned by the API that are not in PREFERENCE_LABELS. */
export function findUnmappedKeys(keys: string[]): string[] {
  return keys.filter((k) => !PREFERENCE_LABELS[k]);
}
