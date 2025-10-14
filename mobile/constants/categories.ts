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
    name: "Cuidado y Belleza",
    icon: "heart",
    description: "Servicios de belleza y cuidado personal",
  },
  {
    id: "wellness",
    name: "Bienestar y Ejercicio",
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
      id: "peluqueria",
      name: "Peluquería y Barbería",
      icon: "cut",
      description: "Corte, peinado, coloración, tratamientos capilares",
    },
    {
      id: "manicure",
      name: "Manicure y Pedicura",
      icon: "hand-left",
      description: "Manicura, pedicura, uñas acrílicas, nail art",
    },
    {
      id: "facial",
      name: "Cuidado Facial",
      icon: "flower",
      description: "Limpieza facial, masajes, tratamientos faciales",
    },
    {
      id: "maquillaje",
      name: "Maquillaje",
      icon: "brush",
      description: "Maquillaje profesional para eventos",
    },
    {
      id: "pestanas",
      name: "Pestañas y Cejas",
      icon: "eye",
      description: "Extensiones, diseño, depilación, laminado",
    },
  ],
  wellness: [
    {
      id: "spa",
      name: "Spa y Relajación",
      icon: "water",
      description: "Masajes, tratamientos corporales, hidroterapia",
    },
    {
      id: "yoga",
      name: "Yoga y Pilates",
      icon: "body",
      description: "Clases de yoga, pilates, meditación",
    },
    {
      id: "nutricion",
      name: "Nutrición",
      icon: "nutrition",
      description: "Asesoría nutricional, coaching",
    },
    {
      id: "terapias",
      name: "Terapias Alternativas",
      icon: "leaf",
      description: "Reiki, acupuntura, aromaterapia",
    },
    {
      id: "coaching",
      name: "Coaching Personal",
      icon: "people",
      description: "Coaching de vida, desarrollo personal",
    },
  ],
  mascotas: [
    {
      id: "guarderia",
      name: "Guardería y Alojamiento",
      icon: "home",
      description: "Guardería, alojamiento, paseos",
    },
    {
      id: "grooming",
      name: "Estética (Grooming)",
      icon: "cut",
      description: "Peluquería, higiene, spa para mascotas",
    },
    {
      id: "veterinario",
      name: "Salud y Bienestar",
      icon: "medical",
      description: "Veterinaria, consultas, vacunas",
    },
    {
      id: "productos",
      name: "Productos y Accesorios",
      icon: "cart",
      description: "Alimentos, juguetes, ropa, suministros",
    },
    {
      id: "otros",
      name: "Servicios Especializados",
      icon: "star",
      description: "Transporte, fotografía",
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
  wellness: "🧘",
  mascotas: "🐾",
  peluqueria: "💇",
  manicure: "💅",
  facial: "✨",
  maquillaje: "💄",
  pestanas: "👁️",
  spa: "🌸",
  yoga: "🧘‍♀️",
  nutricion: "🥗",
  terapias: "🌿",
  coaching: "💪",
  guarderia: "🏠",
  grooming: "🛁",
  veterinario: "🏥",
  productos: "🛍️",
  otros: "⭐",
};

/**
 * Get emoji for a category or sub-category
 */
export const getCategoryEmoji = (categoryId: string): string => {
  return CATEGORY_EMOJIS[categoryId] || "📋";
};
