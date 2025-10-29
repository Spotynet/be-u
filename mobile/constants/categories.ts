/**
 * Categories and Sub-Categories for Be-U Services
 *
 * This file defines the main service categories and their respective sub-categories
 * used throughout the Be-U mobile application.
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
  color?: string;
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
    icon: "heart",
    description: "Servicios de belleza y cuidado personal",
  },
  {
    id: "bienestar",
    name: "Bienestar",
    icon: "fitness",
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
      color: "#FF8C00", // Naranja
    },
    {
      id: "pestanas",
      name: "Pestañas",
      icon: "eye",
      description: "Lash lifting, brown lamination, extensiones, maquillaje",
      color: "#9370DB", // Morado
    },
    {
      id: "cejas",
      name: "Cejas",
      icon: "eye-outline",
      description: "Micropigmentación, microshading, diseño de cejas",
      color: "#8B4513", // Café
    },
    {
      id: "maquillaje_peinado",
      name: "Maquillaje",
      icon: "brush",
      description: "Maquillaje profesional y peinados para eventos",
      color: "#FFB6C1", // Rosado
    },
    {
      id: "manos_pies",
      name: "ManosPies",
      icon: "hand-left",
      description: "Manicure, pedicure, spa, esmaltado en gel, acrílicas",
      color: "#32CD32", // Verde
    },
    {
      id: "faciales",
      name: "Faciales",
      icon: "flower",
      description: "Tratamientos faciales y cuidado de la piel",
      color: "#DC143C", // Rojo
    },
    {
      id: "barberia",
      name: "Barbería",
      icon: "cut",
      description: "Corte de cabello masculino, afeitado, cuidado facial",
      color: "#1E90FF", // Azul
    },
  ],
  bienestar: [
    {
      id: "spa_relajacion",
      name: "Spa",
      icon: "water",
      description: "Masajes, hidroterapia, tratamientos de relajación",
      color: "#87CEEB", // Azul celeste
    },
    {
      id: "yoga",
      name: "Yoga",
      icon: "body",
      description: "Clases de yoga, meditación, mindfulness",
      color: "#E0B0FF", // Morado pastel
    },
    {
      id: "meditacion",
      name: "Meditación",
      icon: "leaf",
      description: "Prácticas de meditación y mindfulness",
      color: "#B2E0B2", // Verde pastel
    },
    {
      id: "access_bar",
      name: "AccessBar",
      icon: "star",
      description: "Técnicas de Access Consciousness",
      color: "#FEBAAD", // Melón
    },
    {
      id: "pilates",
      name: "Pilates",
      icon: "fitness",
      description: "Clases de pilates y fortalecimiento",
      color: "#FFB3B3", // Rojo pastel
    },
    {
      id: "breathwork",
      name: "Breathwork",
      icon: "air",
      description: "Técnicas de respiración y control del aire",
      color: "#000080", // Azul navy
    },
    {
      id: "acupuntura",
      name: "Acupuntura",
      icon: "medical",
      description: "Tratamientos de acupuntura tradicional",
      color: "#FFD700", // Dorado
    },
    {
      id: "fisioterapia",
      name: "Fisioterapia",
      icon: "body",
      description: "Rehabilitación y terapia física",
      color: "#4B5320", // Verde militar
    },
    {
      id: "psicoterapia_coaching",
      name: "Psicoterapia",
      icon: "people",
      description: "Terapia psicológica y coaching personal",
      color: "#FFD1DC", // Rosa pastel
    },
    {
      id: "terapia_holistica",
      name: "Holística",
      icon: "leaf",
      description: "Enfoques holísticos de sanación",
      color: "#FFD700", // Amarillo
    },
    {
      id: "nutricion_alimentacion",
      name: "Nutrición",
      icon: "nutrition",
      description: "Asesoría nutricional y coaching alimentario",
      color: "#8F00FF", // Violeta
    },
  ],
  mascotas: [
    {
      id: "estetica_mascotas",
      name: "Estética",
      icon: "cut",
      description: "Peluquería, baños, corte de uñas para mascotas",
      color: "#FF8C00", // Naranja
    },
    {
      id: "spa_mascotas",
      name: "Spa",
      icon: "water",
      description: "Tratamientos de spa y relajación para mascotas",
      color: "#9370DB", // Morado
    },
    {
      id: "cuidadores",
      name: "Cuidadores",
      icon: "people",
      description: "Cuidado y atención personalizada para mascotas",
      color: "#8B4513", // Café
    },
    {
      id: "paseadores",
      name: "Paseadores",
      icon: "walk",
      description: "Servicios de paseo y ejercicio para mascotas",
      color: "#FFB6C1", // Rosado
    },
    {
      id: "guarderias",
      name: "Guarderías",
      icon: "home",
      description: "Alojamiento y cuidado diurno para mascotas",
      color: "#32CD32", // Verde
    },
    {
      id: "otros",
      name: "Otros",
      icon: "star",
      description: "Servicios especializados para mascotas",
      color: "#DC143C", // Rojo
    },
  ],
};

/**
 * Get all sub-categories for a specific main category
 */
export const getSubCategories = (categoryId: string): SubCategory[] => {
  return SUB_CATEGORIES[categoryId] || [];
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
  const subCategories = SUB_CATEGORIES[categoryId] || [];
  return subCategories.find((sub) => sub.id === subCategoryId);
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
