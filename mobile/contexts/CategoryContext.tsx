import React, {createContext, useState, useContext, ReactNode, useEffect} from "react";

export type MainCategory = "belleza" | "bienestar" | "mascotas";

export type SubCategory = {
  id: string;
  name: string;
  icon: string;
  emoji?: string; // For main categories
  color?: string;
};

interface CategoryContextType {
  selectedMainCategory: MainCategory;
  setSelectedMainCategory: (category: MainCategory) => void;
  selectedSubCategory: string;
  setSelectedSubCategory: (subCategory: string) => void;
  subcategoriesByMainCategory: {[key in MainCategory]: SubCategory[]};
  mainCategories: SubCategory[];
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider = ({children}: CategoryProviderProps) => {
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategory>("belleza");
  const [selectedSubCategory, setSelectedSubCategory] = useState("todos");

  const mainCategories: SubCategory[] = [
    {id: "belleza", emoji: "💄", name: "Belleza", icon: "heart"},
    {id: "bienestar", emoji: "🧘", name: "Bienestar", icon: "fitness"},
    {id: "mascotas", emoji: "🐾", name: "Mascotas", icon: "paw"},
  ];

  const subcategoriesByMainCategory = {
    belleza: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "cabello", name: "Cabello", icon: "cut", color: "#FF8C00"},
      {id: "pestanas", name: "Pestañas", icon: "eye", color: "#9370DB"},
      {id: "cejas", name: "Cejas", icon: "eye-outline", color: "#8B4513"},
      {id: "maquillaje_peinado", name: "Maquillaje", icon: "brush", color: "#FFB6C1"},
      {id: "manos_pies", name: "ManosPies", icon: "hand-left", color: "#32CD32"},
      {id: "faciales", name: "Faciales", icon: "flower", color: "#DC143C"},
      {id: "barberia", name: "Barbería", icon: "cut", color: "#1E90FF"},
    ],
    bienestar: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "spa_relajacion", name: "Spa", icon: "water", color: "#87CEEB"},
      {id: "yoga", name: "Yoga", icon: "body", color: "#E0B0FF"},
      {id: "meditacion", name: "Meditación", icon: "leaf", color: "#B2E0B2"},
      {id: "access_bar", name: "AccessBar", icon: "star", color: "#FEBAAD"},
      {id: "pilates", name: "Pilates", icon: "fitness", color: "#FFB3B3"},
      {id: "breathwork", name: "Breathwork", icon: "air", color: "#000080"},
      {id: "acupuntura", name: "Acupuntura", icon: "medical", color: "#FFD700"},
      {id: "fisioterapia", name: "Fisioterapia", icon: "body", color: "#4B5320"},
      {id: "psicoterapia_coaching", name: "Psicoterapia", icon: "people", color: "#FFD1DC"},
      {id: "terapia_holistica", name: "Holística", icon: "leaf", color: "#FFD700"},
      {id: "nutricion_alimentacion", name: "Nutrición", icon: "nutrition", color: "#8F00FF"},
    ],
    mascotas: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "estetica_mascotas", name: "Estética", icon: "cut", color: "#FF8C00"},
      {id: "spa_mascotas", name: "Spa", icon: "water", color: "#9370DB"},
      {id: "cuidadores", name: "Cuidadores", icon: "people", color: "#8B4513"},
      {id: "paseadores", name: "Paseadores", icon: "walk", color: "#FFB6C1"},
      {id: "guarderias", name: "Guarderías", icon: "home", color: "#32CD32"},
      {id: "otros", name: "Otros", icon: "star", color: "#DC143C"},
    ],
  };

  // Reset subcategory to 'todos' when main category changes
  useEffect(() => {
    setSelectedSubCategory("todos");
  }, [selectedMainCategory]);

  return (
    <CategoryContext.Provider
      value={{
        selectedMainCategory,
        setSelectedMainCategory,
        selectedSubCategory,
        setSelectedSubCategory,
        subcategoriesByMainCategory,
        mainCategories,
      }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
};
