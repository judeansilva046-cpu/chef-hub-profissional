/**
 * Interface comum para adaptadores de integração externa (iFood, 99Food,
 * Keeta, Open Delivery) — ponto de extensão reservado em
 * docs/ARCHITECTURE.md#pontos-de-extensão-futuros. Nenhum adapter chama uma
 * API real nesta sprint: todos lançam `IntegracaoNaoDisponivelError`,
 * porque nenhuma integração real existe sem credenciais homologadas pelo
 * provedor — não é fingido/mockado como se funcionasse.
 */

export type ProvedorIntegracao = "ifood" | "99food" | "keeta" | "open_delivery";

export const PROVEDORES_INTEGRACAO: readonly {
  value: ProvedorIntegracao;
  label: string;
}[] = [
  { value: "ifood", label: "iFood" },
  { value: "99food", label: "99Food" },
  { value: "keeta", label: "Keeta" },
  { value: "open_delivery", label: "Open Delivery" },
];

export class IntegracaoNaoDisponivelError extends Error {
  constructor(provedor: ProvedorIntegracao, operacao: string) {
    super(
      `${operacao} não está disponível para ${provedor}: requer credenciais reais e homologação com o provedor, que este projeto ainda não tem.`,
    );
    this.name = "IntegracaoNaoDisponivelError";
  }
}

export interface ResultadoTesteConexao {
  sucesso: boolean;
  mensagem: string;
}

export interface PedidoExterno {
  idExterno: string;
  status: string;
  valorTotal: number;
  criadoEm: string;
}

/**
 * Todo adapter implementa esta interface — o resto do app (Server Actions,
 * webhook receiver) nunca importa um provedor específico diretamente, só
 * este contrato, para trocar/adicionar provedor sem vazar detalhes no
 * resto do código.
 */
export interface IntegracaoAdapter {
  provedor: ProvedorIntegracao;
  /** Valida as credenciais chamando a API real do provedor — hoje sempre lança IntegracaoNaoDisponivelError. */
  testarConexao(credenciais: Record<string, string>): Promise<ResultadoTesteConexao>;
  /** Busca pedidos novos/atualizados no provedor — hoje sempre lança IntegracaoNaoDisponivelError. */
  sincronizarPedidos(credenciais: Record<string, string>): Promise<PedidoExterno[]>;
  /** Valida a assinatura de um payload de webhook recebido do provedor. */
  validarAssinaturaWebhook(payload: unknown, headers: Headers): boolean;
}
