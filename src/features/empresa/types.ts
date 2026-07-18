export const TIPOS_NEGOCIO = [
  { value: "restaurante", label: "Restaurante" },
  { value: "delivery", label: "Delivery" },
  { value: "dark_kitchen", label: "Dark kitchen" },
  { value: "padaria", label: "Padaria" },
  { value: "confeitaria", label: "Confeitaria" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "produtor_artesanal", label: "Produtor artesanal" },
  { value: "outro", label: "Outro" },
] as const;

export type TipoNegocio = (typeof TIPOS_NEGOCIO)[number]["value"];
