import { createHomologProvider } from "../homolog/create-homolog-provider";
import { fetchJson } from "../http-client";
import { getIntegracoesMode, providerBaseUrl, requireCredentials } from "../mode";
import { callExternal, hmacSha256Hex, timingSafeEqualHex } from "../resilience";
import type {
  ConnectionTestResult,
  ExternalOrder,
  ExternalProduct,
  IntegrationProvider,
  ProviderContext,
} from "../types";

const IFOOD_KEYS = ["client_id", "client_secret", "merchant_id"];

function baseUrl(): string {
  return providerBaseUrl("IFOOD_API_BASE_URL", "https://merchant-api.ifood.com.br");
}

async function obterToken(ctx: ProviderContext): Promise<string> {
  if (ctx.credentials.access_token) return ctx.credentials.access_token;

  const data = await callExternal("ifood:oauth", () =>
    fetchJson<{ accessToken?: string; access_token?: string }>(
      `${baseUrl()}/authentication/v1.0/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grantType: "client_credentials",
          clientId: ctx.credentials.client_id,
          clientSecret: ctx.credentials.client_secret,
        }).toString(),
      },
    ),
  );

  return data.accessToken ?? data.access_token ?? "";
}

/** URL OAuth/autorização (client credentials + merchant). */
export function ifoodOAuthAuthorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state?: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    state: input.state ?? "chefhub",
  });
  return `${baseUrl()}/oauth/authorize?${params.toString()}`;
}

export async function ifoodTrocarCodePorToken(input: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
  const data = await fetchJson<{
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    expiresIn?: number;
  }>(`${baseUrl()}/authentication/v1.0/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grantType: "authorization_code",
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      authorizationCode: input.code,
      authorizationCodeVerifier: input.redirectUri,
    }).toString(),
  });
  return {
    accessToken: data.accessToken ?? data.access_token ?? "",
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  };
}

const live = {
  async conectar(ctx: ProviderContext) {
    if (!requireCredentials(ctx, IFOOD_KEYS)) {
      throw new Error("Credenciais iFood incompletas (client_id, client_secret, merchant_id).");
    }
    await obterToken(ctx);
  },

  async sincronizarProdutos(ctx: ProviderContext): Promise<ExternalProduct[]> {
    const token = await obterToken(ctx);
    const merchantId = ctx.credentials.merchant_id;
    const catalog = await callExternal("ifood:catalog", () =>
      fetchJson<{
        categories?: Array<{
          products?: Array<{
            id: string;
            name: string;
            price?: { value?: number };
            status?: string;
          }>;
        }>;
      }>(`${baseUrl()}/catalog/v1.0/merchants/${merchantId}/catalogs`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    const products: ExternalProduct[] = [];
    for (const cat of catalog.categories ?? []) {
      for (const p of cat.products ?? []) {
        products.push({
          externalId: p.id,
          name: p.name,
          price: Number(p.price?.value ?? 0),
          available: (p.status ?? "AVAILABLE") === "AVAILABLE",
        });
      }
    }
    return products;
  },

  async sincronizarPedidos(ctx: ProviderContext): Promise<ExternalOrder[]> {
    const token = await obterToken(ctx);
    const events = await callExternal("ifood:events", () =>
      fetchJson<Array<{ id: string; code?: string; orderId?: string; createdAt?: string; totalPrice?: number }>>(
        `${baseUrl()}/order/v1.0/events:polling`,
        { headers: { Authorization: `Bearer ${token}` } },
      ),
    );

    return (Array.isArray(events) ? events : []).map((e) => ({
      externalId: e.orderId ?? e.id,
      status: e.code ?? "NEW",
      total: Number(e.totalPrice ?? 0),
      createdAt: e.createdAt ?? new Date().toISOString(),
    }));
  },

  async atualizarStatusPedido(
    ctx: ProviderContext,
    externalOrderId: string,
    status: string,
  ) {
    const token = await obterToken(ctx);
    const map: Record<string, string> = {
      confirmado: "confirm",
      em_preparo: "startPreparation",
      pronto: "readyToPickup",
      saiu_para_entrega: "dispatch",
      cancelado: "requestCancellation",
    };
    const action = map[status] ?? status;
    await callExternal("ifood:status", () =>
      fetchJson(`${baseUrl()}/order/v1.0/orders/${externalOrderId}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
  },

  async testarConexao(ctx: ProviderContext): Promise<ConnectionTestResult> {
    const started = Date.now();
    try {
      await obterToken(ctx);
      return {
        success: true,
        message: "iFood OAuth OK",
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Falha iFood",
        latencyMs: Date.now() - started,
      };
    }
  },

  validarAssinaturaWebhook(payload: unknown, headers: Headers): boolean {
    const secret =
      process.env.IFOOD_WEBHOOK_SECRET ?? process.env.INTEGRACOES_WEBHOOK_SECRET;
    if (!secret) return false;
    const signature = headers.get("x-ifood-signature") ?? headers.get("x-webhook-signature") ?? "";
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    return timingSafeEqualHex(hmacSha256Hex(secret, raw), signature.replace(/^sha256=/, ""));
  },
};

export const ifoodProvider: IntegrationProvider = createHomologProvider({
  id: "ifood",
  category: "delivery",
  requiredCredentialKeys: IFOOD_KEYS,
  sampleProducts: [
    { externalId: "ifood-burger", name: "Burger Homolog", price: 32.9, available: true },
    { externalId: "ifood-soda", name: "Refrigerante", price: 8.5, available: true },
  ],
  sampleOrders: [
    {
      externalId: "ifood-ord-homolog-1",
      status: "PLC",
      total: 41.4,
      createdAt: new Date().toISOString(),
    },
  ],
  live,
});

/** Atualiza estoque/disponibilidade de item no iFood (live). */
export async function ifoodAtualizarEstoqueItem(
  ctx: ProviderContext,
  productId: string,
  available: boolean,
): Promise<void> {
  if (getIntegracoesMode() !== "live") return;
  const token = await obterToken(ctx);
  const merchantId = ctx.credentials.merchant_id;
  await callExternal("ifood:stock", () =>
    fetchJson(
      `${baseUrl()}/catalog/v1.0/merchants/${merchantId}/products/${productId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: available ? "AVAILABLE" : "UNAVAILABLE" }),
      },
    ),
  );
}
