import type {AuthErrorCatalogEntry} from "./types";

/**
 * Single source of truth for auth error copy (Spanish).
 * Interpolate with formatAuthMessage: {seconds}, {attemptsLeft}, {proveedor}.
 */
export const AUTH_ERROR_CATALOG = {
  // —— Client field validation ——
  email_required: {
    message: "Escribe tu correo electrónico.",
    severity: "error",
    scope: "field",
    field: "email",
  },
  email_invalid: {
    message: "Revisa tu correo: parece que le falta algo (ej. ana@email.com).",
    severity: "error",
    scope: "field",
    field: "email",
  },
  role_required: {
    message: "Elige un tipo de cuenta para continuar.",
    severity: "error",
    scope: "field",
    field: "role",
  },
  first_name_required: {
    message: "Escribe tu nombre.",
    severity: "error",
    scope: "field",
    field: "firstName",
  },
  last_name_required: {
    message: "Escribe tu apellido.",
    severity: "error",
    scope: "field",
    field: "lastName",
  },
  name_too_short: {
    message: "Usa al menos 2 caracteres.",
    severity: "error",
    scope: "field",
  },
  name_invalid_chars: {
    message: "Usa solo letras y espacios.",
    severity: "error",
    scope: "field",
  },
  username_required: {
    message: "Elige un nombre de usuario.",
    severity: "error",
    scope: "field",
    field: "username",
  },
  username_too_short: {
    message: "Mínimo 3 caracteres.",
    severity: "error",
    scope: "field",
    field: "username",
  },
  username_invalid: {
    message: "Usa solo letras, números, punto o guion bajo.",
    severity: "error",
    scope: "field",
    field: "username",
  },
  username_taken: {
    message: "Ese nombre de usuario ya está en uso. Prueba con otro.",
    severity: "error",
    scope: "field",
    field: "username",
  },
  terms_required: {
    message: "Acepta los términos y el aviso de privacidad para continuar.",
    severity: "error",
    scope: "field",
    field: "acceptedTerms",
  },
  place_name_required: {
    message: "Escribe el nombre de tu lugar.",
    severity: "error",
    scope: "field",
    field: "placeName",
  },
  category_required: {
    message: "Selecciona al menos una categoría.",
    severity: "error",
    scope: "field",
    field: "categories",
  },
  categories_required: {
    message: "Selecciona al menos una categoría.",
    severity: "error",
    scope: "field",
    field: "categories",
  },
  subcategory_required: {
    message: "Selecciona al menos una subcategoría.",
    severity: "error",
    scope: "field",
    field: "subcategories",
  },
  subcategories_required: {
    message: "Selecciona al menos una subcategoría.",
    severity: "error",
    scope: "field",
    field: "subcategories",
  },
  selection_min: {
    message: "Selecciona al menos {min}.",
    severity: "error",
    scope: "field",
  },
  selection_max: {
    message: "Puedes elegir hasta {max}.",
    severity: "error",
    scope: "field",
  },
  selection_required: {
    message: "Selecciona al menos una opción.",
    severity: "error",
    scope: "field",
  },
  address_invalid: {
    message: "Revisa la dirección.",
    severity: "error",
    scope: "field",
    field: "address",
  },
  city_invalid: {
    message: "Revisa la ciudad.",
    severity: "error",
    scope: "field",
    field: "city",
  },
  country_required: {
    message: "Selecciona tu país.",
    severity: "error",
    scope: "field",
    field: "country",
  },
  country_invalid: {
    message: "Selecciona un país válido.",
    severity: "error",
    scope: "field",
    field: "country",
  },
  phone_invalid: {
    message: "Escribe un teléfono de {digits} dígitos.",
    severity: "error",
    scope: "field",
    field: "phone",
  },
  phone_too_short: {
    message: "Escribe un teléfono de {digits} dígitos.",
    severity: "error",
    scope: "field",
    field: "phone",
  },
  code_incomplete: {
    message: "Escribe los 6 dígitos del código.",
    severity: "error",
    scope: "field",
    field: "code",
  },
  registration_incomplete: {
    message: "Completa tus datos antes de verificar el correo.",
    severity: "warning",
    scope: "form",
  },

  // —— Server / API ——
  email_taken: {
    message: "Este correo ya tiene una cuenta. Inicia sesión o usa otro correo.",
    severity: "error",
    scope: "field",
    field: "email",
    action: {type: "login"},
  },
  email_not_verified: {
    message: "Verifica tu correo para continuar.",
    severity: "warning",
    scope: "form",
    action: {type: "verify"},
  },
  account_not_found: {
    message: "No encontramos una cuenta con esos datos. Revisa e inténtalo de nuevo.",
    severity: "error",
    scope: "form",
  },
  invalid_code: {
    message: "Código incorrecto. Te quedan {attemptsLeft} intentos.",
    severity: "error",
    scope: "field",
    field: "code",
  },
  code_expired: {
    message: "Tu código expiró. Solicita uno nuevo.",
    severity: "warning",
    scope: "form",
    action: {type: "resend"},
  },
  too_many_attempts: {
    message: "Demasiados intentos. Solicita un código nuevo.",
    severity: "error",
    scope: "form",
    action: {type: "resend"},
  },
  no_active_code: {
    message: "No encontramos un código activo. Solicita uno nuevo.",
    severity: "warning",
    scope: "form",
    action: {type: "resend"},
  },
  rate_limited: {
    message: "Demasiados intentos. Espera {seconds} s e inténtalo de nuevo.",
    severity: "warning",
    scope: "form",
  },
  resend_cooldown: {
    message: "Podrás reenviar el código en {seconds} s.",
    severity: "info",
    scope: "form",
  },
  cooldown_active: {
    message: "Podrás reenviar el código en {seconds} s.",
    severity: "info",
    scope: "form",
  },
  network_offline: {
    message: "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    severity: "warning",
    scope: "form",
  },
  network_error: {
    message: "No pudimos conectar con nabbi. Inténtalo de nuevo.",
    severity: "error",
    scope: "toast",
  },
  timeout: {
    message: "No pudimos conectar con nabbi. Inténtalo de nuevo.",
    severity: "error",
    scope: "toast",
  },
  server_error: {
    message: "Algo salió mal de nuestro lado. Inténtalo de nuevo en unos minutos.",
    severity: "error",
    scope: "form",
  },
  unauthorized: {
    message: "Tu sesión expiró. Inicia sesión de nuevo.",
    severity: "warning",
    scope: "form",
    action: {type: "login"},
  },
  session_expired: {
    message: "Tu sesión expiró. Inicia sesión de nuevo.",
    severity: "warning",
    scope: "form",
    action: {type: "login"},
  },
  forbidden: {
    message: "No tienes permiso para realizar esta acción.",
    severity: "error",
    scope: "form",
  },
  social_unavailable: {
    message: "Inicio con {proveedor} no está disponible por ahora.",
    severity: "info",
    scope: "toast",
  },
  social_cancelled: {
    message: "Cancelaste el inicio con {proveedor}.",
    severity: "info",
    scope: "toast",
  },
  social_failed: {
    message: "No pudimos iniciar sesión con {proveedor}. Inténtalo de nuevo.",
    severity: "error",
    scope: "toast",
  },
  unknown: {
    message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    severity: "error",
    scope: "form",
  },
} as const satisfies Record<string, AuthErrorCatalogEntry>;

export type AuthErrorCode = keyof typeof AUTH_ERROR_CATALOG;

export function getCatalogEntry(code: string): AuthErrorCatalogEntry {
  if (code in AUTH_ERROR_CATALOG) {
    return AUTH_ERROR_CATALOG[code as AuthErrorCode];
  }
  return AUTH_ERROR_CATALOG.unknown;
}
