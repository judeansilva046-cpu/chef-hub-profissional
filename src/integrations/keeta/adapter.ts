import {
  IntegracaoNaoDisponivelError,
  type IntegracaoAdapter,
  type PedidoExterno,
  type ResultadoTesteConexao,
} from "../types";

/**
 * Esqueleto do adapter Keeta. Nenhuma chamada à API real existe aqui —
 * requer credenciais de parceiro homologado, que este projeto não tem.
 */
export const keetaAdapter: IntegracaoAdapter = {
  provedor: "keeta",

  async testarConexao(): Promise<ResultadoTesteConexao> {
    throw new IntegracaoNaoDisponivelError("keeta", "Teste de conexão");
  },

  async sincronizarPedidos(): Promise<PedidoExterno[]> {
    throw new IntegracaoNaoDisponivelError("keeta", "Sincronização de pedidos");
  },

  validarAssinaturaWebhook(): boolean {
    return false;
  },
};
