import type { BadgeProps } from "@/components/ui/badge";

export const STATUS_PEDIDO_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_PEDIDO_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  rascunho: "outline",
  confirmado: "info",
  em_preparo: "warning",
  pronto: "success",
  saiu_para_entrega: "info",
  entregue: "success",
  cancelado: "danger",
};

export const TIPO_PEDIDO_LABEL: Record<string, string> = {
  balcao: "Balcão",
  retirada: "Retirada",
  entrega: "Entrega",
  consumo_local: "Consumo local",
  mesa: "Mesa",
};

export const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  credito: "Crédito",
  vale: "Vale",
  pagamento_entrega: "Pagamento na entrega",
};
