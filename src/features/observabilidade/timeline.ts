export type TimelineItem = {
  id: string;
  titulo: string;
  descricao?: string;
  criadoEm: string;
  acao: string;
  entidade: string;
  papel?: string | null;
};

const ACAO_LABEL: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  signup: "Cadastro",
  criar: "Criado",
  editar: "Editado",
  excluir: "Excluído",
  status: "Status alterado",
  pagamento: "Pagamento",
  permissao: "Permissão",
  configuracao: "Configuração",
  troca_senha: "Troca de senha",
};

const ENTIDADE_LABEL: Record<string, string> = {
  auth: "Autenticação",
  pedidos: "Pedido",
  pagamentos: "Pagamento",
  estoque: "Estoque",
  produtos: "Produto",
  fichas_tecnicas: "Produto",
  clientes: "Cliente",
  usuarios: "Usuário",
  membros_empresa: "Usuário",
  configuracoes: "Configuração",
  permissoes: "Permissão",
  caixas: "Caixa",
  ingredientes: "Ingrediente",
};

export function rotuloAcao(acao: string): string {
  return ACAO_LABEL[acao] ?? acao;
}

export function rotuloEntidade(entidade: string): string {
  return ENTIDADE_LABEL[entidade] ?? entidade;
}

export function tituloEventoAuditoria(
  acao: string,
  entidade: string,
  valorNovo?: unknown,
): string {
  const status =
    valorNovo &&
    typeof valorNovo === "object" &&
    valorNovo !== null &&
    "status" in valorNovo
      ? String((valorNovo as { status: unknown }).status)
      : null;

  if (entidade === "pedidos" && status) {
    const map: Record<string, string> = {
      rascunho: "Pedido criado",
      confirmado: "Pedido enviado à cozinha",
      em_preparo: "Pedido em preparo",
      pronto: "Pedido pronto",
      saiu_para_entrega: "Pedido saiu para entrega",
      entregue: "Pedido entregue",
      cancelado: "Pedido cancelado",
    };
    return map[status] ?? `Pedido → ${status}`;
  }

  if (acao === "pagamento") return "Pagamento realizado";
  if (entidade === "caixas" && acao === "status") {
    const fechado =
      valorNovo &&
      typeof valorNovo === "object" &&
      valorNovo !== null &&
      "fechado" in valorNovo &&
      Boolean((valorNovo as { fechado: unknown }).fechado);
    return fechado ? "Fechamento de caixa" : "Abertura de caixa";
  }

  return `${rotuloEntidade(entidade)} — ${rotuloAcao(acao)}`;
}

export function montarTimeline(
  eventos: Array<{
    id: string;
    acao: string;
    entidade: string;
    valor_novo?: unknown;
    criado_em: string;
    papel?: string | null;
    metadados?: Record<string, unknown> | null;
  }>,
): TimelineItem[] {
  return eventos.map((e) => ({
    id: e.id,
    titulo: tituloEventoAuditoria(e.acao, e.entidade, e.valor_novo),
    descricao:
      typeof e.metadados?.mensagem === "string"
        ? e.metadados.mensagem
        : undefined,
    criadoEm: e.criado_em,
    acao: e.acao,
    entidade: e.entidade,
    papel: e.papel,
  }));
}
