import {
  IntegracaoNaoDisponivelError,
  type IntegracaoAdapter,
  type PedidoExterno,
  type ResultadoTesteConexao,
} from "../types";

/**
 * Esqueleto do adapter 99Food. Nenhuma chamada à API real existe aqui —
 * requer credenciais de parceiro homologado, que este projeto não tem.
 */
export const novantaENoveFoodAdapter: IntegracaoAdapter = {
  provedor: "99food",

  async testarConexao(): Promise<ResultadoTesteConexao> {
    throw new IntegracaoNaoDisponivelError("99food", "Teste de conexão");
  },

  async sincronizarPedidos(): Promise<PedidoExterno[]> {
    throw new IntegracaoNaoDisponivelError("99food", "Sincronização de pedidos");
  },

  validarAssinaturaWebhook(): boolean {
    return false;
  },
};
