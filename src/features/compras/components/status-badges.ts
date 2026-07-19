export const SOLICITACAO_STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  convertida: "Convertida em pedido",
  ajuste_solicitado: "Ajuste solicitado",
};

export const SOLICITACAO_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info"
> = {
  pendente: "warning",
  aprovada: "success",
  rejeitada: "danger",
  convertida: "info",
  ajuste_solicitado: "warning",
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORIDADE_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info" | "outline"
> = {
  baixa: "outline",
  normal: "info",
  alta: "warning",
  urgente: "danger",
};

export const COTACAO_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

export const COTACAO_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info" | "outline"
> = {
  aberta: "outline",
  em_andamento: "warning",
  finalizada: "success",
  cancelada: "danger",
};

export const COTACAO_FORNECEDOR_STATUS_LABEL: Record<string, string> = {
  convidado: "Convidado",
  respondido: "Respondido",
  vencedor: "Vencedor",
  recusado: "Recusado",
};

export const COTACAO_FORNECEDOR_STATUS_VARIANT: Record<
  string,
  "warning" | "success" | "danger" | "info" | "outline"
> = {
  convidado: "outline",
  respondido: "info",
  vencedor: "success",
  recusado: "danger",
};

export const PEDIDO_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
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
  aguardando_aprovacao: "warning",
  aprovado: "info",
  enviado: "info",
  parcialmente_recebido: "warning",
  recebido: "success",
  cancelado: "danger",
};
