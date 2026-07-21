import {
  IntegrationNotAvailableError,
  type ConnectionTestResult,
  type ExternalOrder,
  type ExternalProduct,
  type IntegrationCategory,
  type IntegrationProvider,
  type IntegrationProviderId,
  type ProviderContext,
} from "./types";

export function createStubProvider(
  id: IntegrationProviderId,
  category: IntegrationCategory,
): IntegrationProvider {
  const unavailable = (op: string): never => {
    throw new IntegrationNotAvailableError(id, op);
  };

  return {
    id,
    category,
    async conectar(ctx: ProviderContext) {
      void ctx;
      return unavailable("Conectar");
    },
    async desconectar(ctx: ProviderContext) {
      void ctx;
      // Remoto é no-op; desconexão local limpa o banco na action.
    },
    async sincronizarProdutos(ctx: ProviderContext): Promise<ExternalProduct[]> {
      void ctx;
      return unavailable("Sincronizar produtos");
    },
    async sincronizarPedidos(ctx: ProviderContext): Promise<ExternalOrder[]> {
      void ctx;
      return unavailable("Sincronizar pedidos");
    },
    async atualizarStatusPedido(
      ctx: ProviderContext,
      externalOrderId: string,
      status: string,
    ) {
      void ctx;
      void externalOrderId;
      void status;
      return unavailable("Atualizar status do pedido");
    },
    async testarConexao(ctx: ProviderContext): Promise<ConnectionTestResult> {
      void ctx;
      return unavailable("Teste de conexão");
    },
    validarAssinaturaWebhook() {
      return false;
    },
  };
}
