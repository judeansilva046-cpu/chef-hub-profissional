export const TIPOS_GRANDEZA = [
  { value: "massa", label: "Massa" },
  { value: "volume", label: "Volume" },
  { value: "unidade", label: "Unidade" },
] as const;

export type TipoGrandeza = (typeof TIPOS_GRANDEZA)[number]["value"];

export const TIPO_GRANDEZA_LABEL: Record<TipoGrandeza, string> = {
  massa: "Massa",
  volume: "Volume",
  unidade: "Unidade",
};
