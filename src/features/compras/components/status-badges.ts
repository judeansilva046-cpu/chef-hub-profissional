export const SOLICITACAO_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  convertida: "Convertida em pedido",
};

export const SOLICITACAO_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info"
> = {
  pendente: "warning",
  aprovada: "success",
  rejeitada: "danger",
  convertida: "info",
};

export const PEDIDO_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  parcialmente_recebido: "Parcialmente recebido",
  recebido: "Recebido",
  cancelado: "Cancelado",
};

export const PEDIDO_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info" | "outline"
> = {
  rascunho: "outline",
  enviado: "info",
  parcialmente_recebido: "warning",
  recebido: "success",
  cancelado: "danger",
};
