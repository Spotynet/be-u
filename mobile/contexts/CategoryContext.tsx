import React, {createContext, useState, useContext, ReactNode, useEffect} from "react";

export type MainCategory = "belleza" | "bienestar" | "mascotas";

export type SubCategory = {
  id: string;
  name: string;
  icon: string;
  emoji?: string; // For main categories
  iconFamily?: "Ionicons" | "MaterialCommunityIcons";
};

interface CategoryContextType {
  selectedMainCategory: MainCategory;
  setSelectedMainCategory: (category: MainCategory) => void;
  selectedServiceCategory: MainCategory;
  setSelectedServiceCategory: (category: MainCategory) => void;
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
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<MainCategory>("belleza");
  const [selectedSubCategory, setSelectedSubCategory] = useState("todos");

  const mainCategories: SubCategory[] = [
    {
      id: "belleza",
      emoji: "💄",
      name: "Belleza",
      icon: "MaterialCommunityIcons:spa-outline",
      iconFamily: "MaterialCommunityIcons",
    },
    {
      id: "bienestar",
      emoji: "🧘",
      name: "Bienestar",
      icon: "MaterialCommunityIcons:meditation",
      iconFamily: "MaterialCommunityIcons",
    },
    {
      id: "mascotas",
      emoji: "🐾",
      name: "Mascotas",
      icon: "MaterialCommunityIcons:paw",
      iconFamily: "MaterialCommunityIcons",
    },
  ];

  const subcategoriesByMainCategory = {
    belleza: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "cabello", name: "Cabello", icon: "cut"},
      {id: "pestanas", name: "Pestañas", icon: "eye"},
      {id: "cejas", name: "Cejas", icon: "eye-outline"},
      {id: "maquillaje_peinado", name: "Maquillaje", icon: "brush"},
      {id: "manos_pies", name: "ManosPies", icon: "hand-left"},
      {id: "faciales", name: "Faciales", icon: "flower"},
      {id: "barberia", name: "Barbería", icon: "cut"},
    ],
    bienestar: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "spa_relajacion", name: "Spa", icon: "water"},
      {id: "yoga", name: "Yoga", icon: "body"},
      {id: "meditacion", name: "Meditación", icon: "leaf"},
      {id: "access_bar", name: "AccessBar", icon: "star"},
      {id: "pilates", name: "Pilates", icon: "fitness"},
      {id: "breathwork", name: "Breathwork", icon: "air"},
      {id: "acupuntura", name: "Acupuntura", icon: "medical"},
      {id: "fisioterapia", name: "Fisioterapia", icon: "body"},
      {id: "psicoterapia_coaching", name: "Psicoterapia", icon: "people"},
      {id: "terapia_holistica", name: "Holística", icon: "leaf"},
      {id: "nutricion_alimentacion", name: "Nutrición", icon: "nutrition"},
    ],
    mascotas: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "estetica_mascotas", name: "Estética", icon: "cut"},
      {id: "spa_mascotas", name: "Spa", icon: "water"},
      {id: "cuidadores", name: "Cuidadores", icon: "people"},
      {id: "paseadores", name: "Paseadores", icon: "walk"},
      {id: "guarderias", name: "Guarderías", icon: "home"},
      {id: "otros", name: "Otros", icon: "star"},
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
        selectedServiceCategory,
        setSelectedServiceCategory,
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
