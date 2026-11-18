import type {RegisterRole} from "./types";

export const MAIN_CATEGORIES = [
  {id: "belleza", name: "Belleza"},
  {id: "bienestar", name: "Bienestar"},
  {id: "mascotas", name: "Mascotas"},
] as const;

export const SUB_CATEGORIES: Record<string, Array<{id: string; name: string}>> = {
  belleza: [
    {id: "cabello", name: "Cabello"},
    {id: "pestanas", name: "Pestañas"},
    {id: "cejas", name: "Cejas"},
    {id: "maquillaje_peinado", name: "Maquillaje"},
    {id: "manos_pies", name: "Manos y pies"},
    {id: "faciales", name: "Faciales"},
    {id: "barberia", name: "Barbería"},
  ],
  bienestar: [
    {id: "spa_relajacion", name: "Spa"},
    {id: "yoga", name: "Yoga"},
    {id: "meditacion", name: "Meditación"},
    {id: "access_bar", name: "Access Bars"},
    {id: "pilates", name: "Pilates"},
    {id: "breathwork", name: "Breathwork"},
    {id: "acupuntura", name: "Acupuntura"},
    {id: "fisioterapia", name: "Fisioterapia"},
    {id: "psicoterapia_coaching", name: "Psicoterapia"},
    {id: "terapia_holistica", name: "Holística"},
    {id: "nutricion_alimentacion", name: "Nutrición"},
  ],
  mascotas: [
    {id: "estetica_mascotas", name: "Estética"},
    {id: "spa_mascotas", name: "Spa"},
    {id: "cuidadores", name: "Cuidadores"},
    {id: "paseadores", name: "Paseadores"},
    {id: "guarderias", name: "Guarderías"},
    {id: "otros", name: "Otros"},
  ],
};

/** Per-role field flags — same surface as the previous single-page register form. */
export const ROLE_FIELD_CONFIG: Record<
  RegisterRole,
  {
    usesPlaceName: boolean;
    showNameRow: boolean;
    showPhone: boolean;
    showCategory: boolean;
    showBio: boolean;
    addressAlwaysOpen: boolean;
  }
> = {
  client: {
    usesPlaceName: false,
    showNameRow: true,
    showPhone: false,
    showCategory: false,
    showBio: false,
    addressAlwaysOpen: false,
  },
  professional: {
    usesPlaceName: false,
    showNameRow: true,
    showPhone: true,
    showCategory: true,
    showBio: true,
    addressAlwaysOpen: true,
  },
  place: {
    usesPlaceName: true,
    showNameRow: false,
    showPhone: true,
    showCategory: true,
    showBio: false,
    addressAlwaysOpen: true,
  },
};

export const ROLE_OPTIONS: Array<{
  value: RegisterRole;
  title: string;
  description: string;
}> = [
  {
    value: "client",
    title: "Cliente",
    description: "Reserva servicios y descubre profesionales.",
  },
  {
    value: "professional",
    title: "Profesional",
    description: "Ofrece tus servicios y gestiona tu agenda.",
  },
  {
    value: "place",
    title: "Lugar",
    description: "Administra tu negocio y las reservas de tu espacio.",
  },
];
