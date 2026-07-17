/**
 * Constante de dados pura (sem "use client") — importada tanto pelo Server
 * Component da página (validação do searchParam `tipo`) quanto pelo Client
 * Component do seletor. Precisa viver fora de um arquivo "use client":
 * exports de um módulo client não são utilizáveis a partir de um Server
 * Component no modelo de RSC do Next.js (viram uma referência opaca, não o
 * valor real — daí o TypeError "RELATORIO_TIPOS.some is not a function"
 * quando isso estava dentro de relatorio-tipo-select.tsx).
 */
export const RELATORIO_TIPOS = [
  { value: "vendas", label: "Vendas" },
  { value: "cmv", label: "CMV" },
  { value: "margem", label: "Margem" },
  { value: "produto", label: "Por produto" },
  { value: "canal", label: "Por canal" },
  { value: "estoque", label: "Estoque" },
  { value: "compras", label: "Compras" },
  { value: "producao", label: "Produção" },
] as const;

export type RelatorioTipo = (typeof RELATORIO_TIPOS)[number]["value"];
