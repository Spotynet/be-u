export interface PostFormat {
  id: string;
  icon: string;
  title: string;
  description: string;
  roles: string[];
  color: string;
}

export const postFormats: PostFormat[] = [
  {
    id: "video",
    icon: "videocam",
    title: "Video",
    description: "Stories-like, expira en 24h",
    roles: ["PROFESSIONAL", "PLACE"],
    color: "#FF6B6B",
  },
  {
    id: "photo",
    icon: "camera",
    title: "Foto + Descripción",
    description: "Comparte una foto",
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    color: "#4ECDC4",
  },
  {
    id: "before_after",
    icon: "swap-horizontal",
    title: "Antes/Después",
    description: "Muestra tu transformación",
    roles: ["PROFESSIONAL", "PLACE"],
    color: "#FFD93D",
  },
  {
    id: "tips",
    icon: "bulb",
    title: "Tips",
    description: "Comparte consejos",
    roles: ["ADMIN"],
    color: "#6BCF7F",
  },
  {
    id: "mosaic",
    icon: "grid",
    title: "Mosaico",
    description: "Galería de fotos",
    roles: ["PROFESSIONAL", "PLACE"],
    color: "#FF8A65",
  },
  {
    id: "carousel",
    icon: "layers",
    title: "Carrusel",
    description: "Máx. 5 fotos, desliza para ver",
    roles: ["PROFESSIONAL", "PLACE"],
    color: "#9B59B6",
  },
  {
    id: "pet_adoption",
    icon: "paw",
    title: "Adoptar Mascotas",
    description: "Publica mascotas para adopción",
    roles: ["CLIENT", "PROFESSIONAL", "PLACE"],
    color: "#FF6B9D",
  },
  {
    id: "poll",
    icon: "bar-chart",
    title: "Encuesta",
    description: "Crea una encuesta",
    roles: ["ADMIN"],
    color: "#64B5F6",
  },
];






























