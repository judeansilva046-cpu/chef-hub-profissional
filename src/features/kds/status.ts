import type { BadgeProps } from "@/components/ui/badge";

/** Labels do fluxo operacional do KDS (inclui “Expedido” para saiu_para_entrega). */
export const STATUS_KDS_LABEL: Record<string, string> = {
  rascunho: "Novo",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Expedido",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_KDS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  rascunho: "outline",
  confirmado: "info",
  em_preparo: "warning",
  pronto: "success",
  saiu_para_entrega: "info",
  entregue: "success",
  cancelado: "danger",
};

export const SETOR_KDS_LABEL: Record<string, string> = {
  cozinha: "Cozinha",
  bar: "Bar",
  sobremesas: "Sobremesas",
};

export const SETORES_KDS = ["cozinha", "bar", "sobremesas"] as const;
export type SetorKds = (typeof SETORES_KDS)[number];

export const EVENTO_KDS_LABEL: Record<string, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  iniciou_preparo: "Iniciou preparo",
  item_pronto: "Item pronto",
  pedido_pronto: "Pedido pronto",
  expedido: "Expedido",
  entregue: "Entregue",
  reimpressao: "Reimpressão",
  cancelado: "Cancelado",
  alerta_atraso: "Alerta de atraso",
};
