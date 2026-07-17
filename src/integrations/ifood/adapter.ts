import {
  IntegracaoNaoDisponivelError,
  type IntegracaoAdapter,
  type PedidoExterno,
  type ResultadoTesteConexao,
} from "../types";

/**
 * Esqueleto do adapter iFood. Nenhuma chamada à API real do iFood existe
 * aqui — requer credenciais de parceiro homologado (Client ID/Secret via
 * OAuth do Portal do Parceiro iFood), que este projeto não tem. Implementar
 * de verdade quando essas credenciais existirem.
 */
export const ifoodAdapter: IntegracaoAdapter = {
  provedor: "ifood",

  async testarConexao(): Promise<ResultadoTesteConexao> {
    throw new IntegracaoNaoDisponivelError("ifood", "Teste de conexão");
  },

  async sincronizarPedidos(): Promise<PedidoExterno[]> {
    throw new IntegracaoNaoDisponivelError("ifood", "Sincronização de pedidos");
  },

  validarAssinaturaWebhook(): boolean {
    // Sem segredo de assinatura real configurado — todo webhook recebido é
    // logado como assinatura_valida=false (ver /api/webhooks/[provedor]).
    return false;
  },
};
