/**
 * Categories and Sub-Categories for nabbi Services
 *
 * This file defines the main service categories and their respective sub-categories
 * used throughout the nabbi mobile application.
 */

import {ServiceCategory} from "@/types/global";

export interface Category {
  id: ServiceCategory | "todos";
  name: string;
  icon: string;
  description?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  // color property removed to support static theme
}

/**
 * Main service categories
 */
export const MAIN_CATEGORIES: Category[] = [
  {
    id: "todos",
    name: "Todos",
    icon: "apps",
    description: "Todos los servicios",
  },
  {
    id: "belleza",
    name: "Belleza",
    icon: "spa-outline",
    description: "Servicios de belleza y cuidado personal",
  },
  {
    id: "bienestar",
    name: "Bienestar",
    icon: "meditation",
    description: "Servicios de bienestar, salud y ejercicio",
  },
  {
    id: "mascotas",
    name: "Mascotas",
    icon: "paw",
    description: "Servicios para el cuidado de mascotas",
  },
];

/**
 * Sub-categories organized by main category
 */
export const SUB_CATEGORIES: Record<string, SubCategory[]> = {
  todos: [],
  belleza: [
    {
      id: "cabello",
      name: "Cabello",
      icon: "cut",
      description: "Corte, color, peinado, alisado, extensiones",
    },
    {
      id: "pestanas",
      name: "Pestañas",
      icon: "eye",
      description: "Lash lifting, brown lamination, extensiones, maquillaje",
    },
    {
      id: "cejas",
      name: "Cejas",
      icon: "eye-outline",
      description: "Micropigmentación, microshading, diseño de cejas",
    },
    {
      id: "maquillaje_peinado",
      name: "Maquillaje",
      icon: "brush",
      description: "Maquillaje profesional y peinados para eventos",
    },
    {
      id: "manos_pies",
      name: "ManosPies",
      icon: "hand-left",
      description: "Manicure, pedicure, spa, esmaltado en gel, acrílicas",
    },
    {
      id: "faciales",
      name: "Faciales",
      icon: "flower",
      description: "Tratamientos faciales y cuidado de la piel",
    },
    {
      id: "barberia",
      name: "Barbería",
      icon: "cut",
      description: "Corte de cabello masculino, afeitado, cuidado facial",
    },
  ],
  bienestar: [
    {
      id: "spa_relajacion",
      name: "Spa",
      icon: "water",
      description: "Masajes, hidroterapia, tratamientos de relajación",
    },
    {
      id: "yoga",
      name: "Yoga",
      icon: "body",
      description: "Clases de yoga, meditación, mindfulness",
    },
    {
      id: "meditacion",
      name: "Meditación",
      icon: "leaf",
      description: "Prácticas de meditación y mindfulness",
    },
    {
      id: "access_bar",
      name: "AccessBar",
      icon: "star",
      description: "Técnicas de Access Consciousness",
    },
    {
      id: "pilates",
      name: "Pilates",
      icon: "fitness",
      description: "Clases de pilates y fortalecimiento",
    },
    {
      id: "breathwork",
      name: "Breathwork",
      icon: "air",
      description: "Técnicas de respiración y control del aire",
    },
    {
      id: "acupuntura",
      name: "Acupuntura",
      icon: "medical",
      description: "Tratamientos de acupuntura tradicional",
    },
    {
      id: "fisioterapia",
      name: "Fisioterapia",
      icon: "body",
      description: "Rehabilitación y terapia física",
    },
    {
      id: "psicoterapia_coaching",
      name: "Psicoterapia",
      icon: "people",
      description: "Terapia psicológica y coaching personal",
    },
    {
      id: "terapia_holistica",
      name: "Holística",
      icon: "leaf",
      description: "Enfoques holísticos de sanación",
    },
    {
      id: "nutricion_alimentacion",
      name: "Nutrición",
      icon: "nutrition",
      description: "Asesoría nutricional y coaching alimentario",
    },
  ],
  mascotas: [
    {
      id: "estetica_mascotas",
      name: "Estética",
      icon: "cut",
      description: "Peluquería, baños, corte de uñas para mascotas",
    },
    {
      id: "spa_mascotas",
      name: "Spa",
      icon: "water",
      description: "Tratamientos de spa y relajación para mascotas",
    },
    {
      id: "cuidadores",
      name: "Cuidadores",
      icon: "people",
      description: "Cuidado y atención personalizada para mascotas",
    },
    {
      id: "paseadores",
      name: "Paseadores",
      icon: "walk",
      description: "Servicios de paseo y ejercicio para mascotas",
    },
    {
      id: "guarderias",
      name: "Guarderías",
      icon: "home",
      description: "Alojamiento y cuidado diurno para mascotas",
    },
    {
      id: "otros",
      name: "Otros",
      icon: "star",
      description: "Servicios especializados para mascotas",
    },
  ],
};

/**
 * Get all sub-categories for a specific main category
 */
export const getSubCategories = (categoryId: string): SubCategory[] => {
  const normalizedCategoryId = categoryId?.toLowerCase();
  return SUB_CATEGORIES[normalizedCategoryId] || [];
};

/**
 * Get main category id (belleza, bienestar, mascotas) for a given subcategory id or specialty name.
 * Used to group favorites by main category.
 */
export const getMainCategoryIdForSubcategory = (subcategoryOrSpecialty: string): string | null => {
  if (!subcategoryOrSpecialty || subcategoryOrSpecialty === "todos") return null;
  const normalized = subcategoryOrSpecialty.toLowerCase().trim();
  const mainIds = ["belleza", "bienestar", "mascotas"] as const;
  for (const mainId of mainIds) {
    const subs = SUB_CATEGORIES[mainId] || [];
    const found = subs.some(
      (s) =>
        s.id.toLowerCase() === normalized ||
        s.name.toLowerCase() === normalized ||
        s.name.toLowerCase().replace(/\s+/g, "") === normalized.replace(/\s+/g, "")
    );
    if (found) return mainId;
  }
  return null;
};

/**
 * Get category by ID
 */
export const getCategoryById = (categoryId: string): Category | undefined => {
  return MAIN_CATEGORIES.find((cat) => cat.id === categoryId);
};

/**
 * Get sub-category by ID within a specific category
 */
export const getSubCategoryById = (
  categoryId: string,
  subCategoryId: string
): SubCategory | undefined => {
  // Normalize category ID to lowercase for lookup
  const normalizedCategoryId = categoryId?.toLowerCase();
  const subCategories = SUB_CATEGORIES[normalizedCategoryId] || [];
  // Case-insensitive matching for subcategory ID
  return subCategories.find(
    (sub) => sub.id.toLowerCase() === subCategoryId?.toLowerCase()
  );
};

/**
 * Category emoji/icon mappings for display purposes
 */
export const CATEGORY_EMOJIS: Record<string, string> = {
  belleza: "💄",
  bienestar: "🧘",
  mascotas: "🐾",
  cabello: "💇",
  pestanas: "👁️",
  cejas: "🤨",
  maquillaje_peinado: "💄",
  manos_pies: "💅",
  faciales: "✨",
  barberia: "✂️",
  spa_relajacion: "🌸",
  yoga: "🧘‍♀️",
  meditacion: "🧘",
  access_bar: "⭐",
  pilates: "🤸",
  breathwork: "💨",
  acupuntura: "🪡",
  fisioterapia: "🏥",
  psicoterapia_coaching: "💪",
  terapia_holistica: "🌿",
  nutricion_alimentacion: "🥗",
  estetica_mascotas: "🛁",
  spa_mascotas: "🌸",
  cuidadores: "👥",
  paseadores: "🚶",
  guarderias: "🏠",
  otros: "⭐",
};

/**
 * Get emoji for a category or sub-category
 */
export const getCategoryEmoji = (categoryId: string): string => {
  return CATEGORY_EMOJIS[categoryId] || "📋";
};

/**
 * Get avatar background color based on subcategory
 * For data-viz only — do not use for UI components
 */
export const getAvatarColorFromSubcategory = (
  categoryId?: string | string[],
  subCategoryIds?: string[]
): string => {
  // Use static brand color for all UI elements
  return "#558367"; // brandMuted
};

/**
 * Get a hex color for a category (main or sub) by id or name.
 * For data-viz only — do not use for UI components
 */
export const getCategoryColor = (
  categoryIdOrName?: string | number
): string => {
  // Use static brand color for all UI elements
  return "#1F3328"; // brandDark
};