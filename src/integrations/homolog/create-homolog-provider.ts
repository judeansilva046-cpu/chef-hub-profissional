import { getIntegracoesMode, requireCredentials } from "../mode";
import { hmacSha256Hex, timingSafeEqualHex } from "../resilience";
import {
  IntegrationNotAvailableError,
  type ConnectionTestResult,
  type ExternalOrder,
  type ExternalProduct,
  type IntegrationCategory,
  type IntegrationProvider,
  type IntegrationProviderId,
  type ProviderContext,
} from "../types";

export interface HomologProviderOptions {
  id: IntegrationProviderId;
  category: IntegrationCategory;
  requiredCredentialKeys?: string[];
  /** Produtos/pedidos simulados em homolog. */
  sampleProducts?: ExternalProduct[];
  sampleOrders?: ExternalOrder[];
  /** Live implementations — usadas quando INTEGRACOES_MODE=live e há credenciais. */
  live?: Partial<
    Pick<
      IntegrationProvider,
      | "conectar"
      | "sincronizarProdutos"
      | "sincronizarPedidos"
      | "atualizarStatusPedido"
      | "testarConexao"
      | "validarAssinaturaWebhook"
    >
  >;
}

function defaultProducts(id: string): ExternalProduct[] {
  return [
    {
      externalId: `${id}-prod-1`,
      name: "Produto Homologação 1",
      price: 29.9,
      available: true,
    },
    {
      externalId: `${id}-prod-2`,
      name: "Produto Homologação 2",
      price: 19.5,
      available: true,
    },
  ];
}

function defaultOrders(id: string): ExternalOrder[] {
  return [
    {
      externalId: `${id}-ord-1`,
      status: "CONFIRMED",
      total: 49.4,
      createdAt: new Date().toISOString(),
    },
  ];
}

/**
 * Provider homologável: em `homolog` retorna shapes reais sem rede;
 * em `live` delega para implementações HTTP quando há credenciais.
 */
export function createHomologProvider(
  opts: HomologProviderOptions,
): IntegrationProvider {
  const keys = opts.requiredCredentialKeys ?? [];
  const products = opts.sampleProducts ?? defaultProducts(opts.id);
  const orders = opts.sampleOrders ?? defaultOrders(opts.id);

  const ensureLive = (ctx: ProviderContext, op: string) => {
    const mode = getIntegracoesMode();
    if (mode === "disabled") {
      throw new IntegrationNotAvailableError(opts.id, `${op} (modo disabled)`);
    }
    if (mode === "live" && keys.length > 0 && !requireCredentials(ctx, keys)) {
      throw new IntegrationNotAvailableError(
        opts.id,
        `${op} (credenciais ausentes em modo live)`,
      );
    }
  };

  return {
    id: opts.id,
    category: opts.category,

    async conectar(ctx) {
      ensureLive(ctx, "Conectar");
      if (getIntegracoesMode() === "live" && opts.live?.conectar) {
        return opts.live.conectar(ctx);
      }
      // homolog: marca conexão local como ok (persistência na action)
    },

    async desconectar() {
      /* no-op remoto */
    },

    async sincronizarProdutos(ctx) {
      ensureLive(ctx, "Sincronizar produtos");
      if (getIntegracoesMode() === "live" && opts.live?.sincronizarProdutos) {
        return opts.live.sincronizarProdutos(ctx);
      }
      return products;
    },

    async sincronizarPedidos(ctx) {
      ensureLive(ctx, "Sincronizar pedidos");
      if (getIntegracoesMode() === "live" && opts.live?.sincronizarPedidos) {
        return opts.live.sincronizarPedidos(ctx);
      }
      return orders;
    },

    async atualizarStatusPedido(ctx, externalOrderId, status) {
      ensureLive(ctx, "Atualizar status");
      if (getIntegracoesMode() === "live" && opts.live?.atualizarStatusPedido) {
        return opts.live.atualizarStatusPedido(ctx, externalOrderId, status);
      }
      void externalOrderId;
      void status;
    },

    async testarConexao(ctx): Promise<ConnectionTestResult> {
      ensureLive(ctx, "Teste de conexão");
      const started = Date.now();
      if (getIntegracoesMode() === "live" && opts.live?.testarConexao) {
        return opts.live.testarConexao(ctx);
      }
      return {
        success: true,
        message: `Homologação OK — ${opts.id} (modo ${getIntegracoesMode()})`,
        latencyMs: Date.now() - started,
      };
    },

    validarAssinaturaWebhook(payload, headers) {
      if (opts.live?.validarAssinaturaWebhook) {
        return opts.live.validarAssinaturaWebhook(payload, headers);
      }
      const secret =
        process.env[`INTEGRACAO_${opts.id.toUpperCase()}_WEBHOOK_SECRET`] ??
        process.env.INTEGRACOES_WEBHOOK_SECRET;
      // Sem secret → assinatura inválida; inbox aceita via INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED.
      if (!secret) return false;
      const signature =
        headers.get("x-webhook-signature") ??
        headers.get("x-hub-signature-256") ??
        headers.get("x-ifood-signature") ??
        "";
      const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
      const expected = hmacSha256Hex(secret, raw);
      const provided = signature.replace(/^sha256=/, "");
      return timingSafeEqualHex(expected, provided);
    },
  };
}
