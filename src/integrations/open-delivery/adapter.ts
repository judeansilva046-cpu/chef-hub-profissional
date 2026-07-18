import {
  IntegracaoNaoDisponivelError,
  type IntegracaoAdapter,
  type PedidoExterno,
  type ResultadoTesteConexao,
} from "../types";

/**
 * Esqueleto do adapter Open Delivery (padrão aberto, não uma empresa
 * específica). Nenhuma chamada real existe aqui — requer endpoint e
 * credenciais de um provedor que implemente a especificação Open Delivery,
 * que este projeto ainda não tem configurado.
 */
export const openDeliveryAdapter: IntegracaoAdapter = {
  provedor: "open_delivery",

  async testarConexao(): Promise<ResultadoTesteConexao> {
    throw new IntegracaoNaoDisponivelError("open_delivery", "Teste de conexão");
  },

  async sincronizarPedidos(): Promise<PedidoExterno[]> {
    throw new IntegracaoNaoDisponivelError("open_delivery", "Sincronização de pedidos");
  },

  validarAssinaturaWebhook(): boolean {
    return false;
  },
};
