/**
 * User-facing cancellation reasons and internal codes for analytics.
 * Backend receives the code as the `reason` string.
 */
export const CANCELLATION_REASONS = [
  { code: "SURGIO_IMPREVISTO", label: "Surgió un imprevisto" },
  { code: "YA_NO_LA_NECESITO", label: "Ya no la necesito" },
  { code: "SALUD_EMERGENCIA", label: "Salud / Emergencia" },
  { code: "CONSEGUI_POR_MI_CUENTA", label: "Conseguí por mi cuenta" },
  { code: "ERROR_DE_DEDO", label: "Error de dedo" },
  { code: "HORARIO_INCORRECTO", label: "Horario incorrecto" },
  { code: "COSTO", label: "Costo" },
  { code: "PROFESIONAL_CANCELO", label: "El profesional canceló" },
  { code: "OTRO", label: "Otro" },
] as const;

export type CancellationReasonCode = (typeof CANCELLATION_REASONS)[number]["code"];

export const CANCELLATION_REASON_HORARIO_INCORRECTO: CancellationReasonCode = "HORARIO_INCORRECTO";
export const CANCELLATION_REASON_YA_NO_LA_NECESITO: CancellationReasonCode = "YA_NO_LA_NECESITO";
