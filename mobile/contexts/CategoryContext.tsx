import React, {createContext, useState, useContext, ReactNode, useEffect} from "react";

export type MainCategory = "belleza" | "cuidado" | "mascotas";

export type SubCategory = {
  id: string;
  name: string;
  icon: string;
  emoji?: string; // For main categories
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
    {id: "belleza", emoji: "💅", name: "Belleza", icon: "cut"},
    {id: "cuidado", emoji: "❤️", name: "Cuidado", icon: "medkit"},
    {id: "mascotas", emoji: "🐾", name: "Mascotas", icon: "paw"},
  ];

  const subcategoriesByMainCategory = {
    belleza: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "manicure", name: "Manicure & Pedicure", icon: "hand-left"},
      {id: "maquillaje", name: "Make Up", icon: "brush"},
      {id: "barberia", name: "Barbería", icon: "cut"},
      {id: "facial", name: "Facial", icon: "flower"},
      {id: "masaje", name: "Masaje", icon: "fitness"},
    ],
    cuidado: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "fisioterapia", name: "Fisioterapia", icon: "medical"},
      {id: "masajes", name: "Masajes Terapéuticos", icon: "fitness"},
      {id: "acupuntura", name: "Acupuntura", icon: "medical-outline"},
      {id: "quiropraxia", name: "Quiropraxia", icon: "body"},
      {id: "meditacion", name: "Meditación", icon: "leaf"},
      {id: "yoga", name: "Yoga", icon: "flower-outline"},
      {id: "spa", name: "Spa & Relajación", icon: "water"},
    ],
    mascotas: [
      {id: "todos", name: "Todos", icon: "apps"},
      {id: "comida", name: "Comida", icon: "restaurant"},
      {id: "ropa", name: "Ropa", icon: "shirt"},
      {id: "accesorios", name: "Accesorios", icon: "diamond"},
      {id: "muebles", name: "Muebles", icon: "bed"},
      {id: "cortes", name: "Cortes", icon: "cut"},
      {id: "veterinarios", name: "Veterinarios", icon: "medical"},
      {id: "juguetes", name: "Juguetes", icon: "game-controller"},
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
