/**
 * Contratos desacoplados da Central de Integrações (Sprint 13+).
 * Sprint 18: providers homologáveis — `INTEGRACOES_MODE=homolog|live|disabled`.
 * Em live, chamadas HTTP reais exigem credenciais do parceiro.
 */

export type IntegrationCategory =
  | "delivery"
  | "whatsapp"
  | "pix"
  | "printer"
  | "cardapio_digital";

export type IntegrationProviderId =
  // Delivery
  | "ifood"
  | "anota_ai"
  | "delivery_direto"
  | "goomer"
  | "cardapio_web"
  | "99food"
  | "keeta"
  | "open_delivery"
  // WhatsApp
  | "whatsapp_cloud"
  | "evolution_api"
  // PIX
  | "mercado_pago"
  | "asaas"
  | "pagseguro"
  | "stone"
  | "cielo"
  // Impressoras
  | "epson"
  | "elgin"
  | "bematech"
  | "escpos"
  // Cardápio digital
  | "cardapio_digital";

export type IntegrationStatus =
  | "offline"
  | "pending"
  | "online"
  | "error"
  | "disabled";

export interface ProviderCatalogItem {
  id: IntegrationProviderId;
  label: string;
  category: IntegrationCategory;
  description: string;
}

export const PROVIDER_CATALOG: readonly ProviderCatalogItem[] = [
  {
    id: "ifood",
    label: "iFood",
    category: "delivery",
    description: "Marketplace de delivery (OAuth parceiro).",
  },
  {
    id: "anota_ai",
    label: "Anota AI",
    category: "delivery",
    description: "Pedidos e cardápio Anota AI.",
  },
  {
    id: "delivery_direto",
    label: "Delivery Direto",
    category: "delivery",
    description: "Canal Delivery Direto.",
  },
  {
    id: "goomer",
    label: "Goomer",
    category: "delivery",
    description: "Cardápio digital / delivery Goomer.",
  },
  {
    id: "cardapio_web",
    label: "Cardápio Web",
    category: "delivery",
    description: "Integração Cardápio Web.",
  },
  {
    id: "99food",
    label: "99Food",
    category: "delivery",
    description: "Marketplace 99Food (legado Sprint 04).",
  },
  {
    id: "keeta",
    label: "Keeta",
    category: "delivery",
    description: "Marketplace Keeta (legado Sprint 04).",
  },
  {
    id: "open_delivery",
    label: "Open Delivery",
    category: "delivery",
    description: "Padrão Open Delivery.",
  },
  {
    id: "whatsapp_cloud",
    label: "WhatsApp Cloud API",
    category: "whatsapp",
    description: "Meta WhatsApp Cloud API — templates e confirmações.",
  },
  {
    id: "evolution_api",
    label: "Evolution API",
    category: "whatsapp",
    description: "Gateway Evolution API para WhatsApp.",
  },
  {
    id: "mercado_pago",
    label: "Mercado Pago",
    category: "pix",
    description: "Gateway PIX Mercado Pago.",
  },
  {
    id: "asaas",
    label: "Asaas",
    category: "pix",
    description: "Gateway PIX Asaas.",
  },
  {
    id: "pagseguro",
    label: "PagSeguro",
    category: "pix",
    description: "Gateway PIX PagSeguro.",
  },
  {
    id: "stone",
    label: "Stone",
    category: "pix",
    description: "Gateway PIX Stone.",
  },
  {
    id: "cielo",
    label: "Cielo",
    category: "pix",
    description: "Gateway PIX Cielo.",
  },
  {
    id: "epson",
    label: "Epson",
    category: "printer",
    description: "Impressoras térmicas Epson (ESC/POS).",
  },
  {
    id: "elgin",
    label: "Elgin",
    category: "printer",
    description: "Impressoras térmicas Elgin.",
  },
  {
    id: "bematech",
    label: "Bematech",
    category: "printer",
    description: "Impressoras térmicas Bematech.",
  },
  {
    id: "escpos",
    label: "ESC/POS genérico",
    category: "printer",
    description: "Driver genérico ESC/POS.",
  },
  {
    id: "cardapio_digital",
    label: "Cardápio Digital",
    category: "cardapio_digital",
    description: "QR Code, autoatendimento e pedidos na mesa.",
  },
] as const;

export class IntegrationNotAvailableError extends Error {
  constructor(provider: IntegrationProviderId, operation: string) {
    super(
      `${operation} não está disponível para ${provider}: requer homologação com credenciais reais do provedor (não simulamos produção).`,
    );
    this.name = "IntegrationNotAvailableError";
  }
}

/** @deprecated use IntegrationNotAvailableError */
export class IntegracaoNaoDisponivelError extends IntegrationNotAvailableError {
  constructor(provedor: IntegrationProviderId, operacao: string) {
    super(provedor, operacao);
    this.name = "IntegracaoNaoDisponivelError";
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

export interface ExternalOrder {
  externalId: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface ExternalProduct {
  externalId: string;
  name: string;
  price: number;
  available: boolean;
}

export interface ProviderContext {
  empresaId: string;
  integrationId: string;
  credentials: Record<string, string>;
  config: Record<string, unknown>;
}

/**
 * Contrato mínimo de todo conector (delivery e base dos demais).
 * O app nunca importa um provider concreto — só este contrato + registry.
 */
export interface IntegrationProvider {
  id: IntegrationProviderId;
  category: IntegrationCategory;
  conectar(ctx: ProviderContext): Promise<void>;
  desconectar(ctx: ProviderContext): Promise<void>;
  sincronizarProdutos(ctx: ProviderContext): Promise<ExternalProduct[]>;
  sincronizarPedidos(ctx: ProviderContext): Promise<ExternalOrder[]>;
  atualizarStatusPedido(
    ctx: ProviderContext,
    externalOrderId: string,
    status: string,
  ): Promise<void>;
  testarConexao(ctx: ProviderContext): Promise<ConnectionTestResult>;
  validarAssinaturaWebhook(payload: unknown, headers: Headers): boolean;
}

export interface WhatsAppCapabilities {
  enviarMensagem(
    ctx: ProviderContext,
    to: string,
    body: string,
  ): Promise<{ messageId: string }>;
  enviarTemplate(
    ctx: ProviderContext,
    to: string,
    template: string,
    params?: Record<string, string>,
  ): Promise<{ messageId: string }>;
  notificarStatusPedido(
    ctx: ProviderContext,
    to: string,
    orderStatus: string,
  ): Promise<void>;
}

export interface PixGateway {
  gerarQrCode(
    ctx: ProviderContext,
    input: { amount: number; description: string; externalRef: string },
  ): Promise<{ qrCode: string; txid: string; expiresAt: string }>;
  consultarPagamento(
    ctx: ProviderContext,
    txid: string,
  ): Promise<{ status: string; paidAt?: string }>;
  cancelar(ctx: ProviderContext, txid: string): Promise<void>;
  processarWebhook(ctx: ProviderContext, payload: unknown): Promise<void>;
  conciliar(
    ctx: ProviderContext,
    from: string,
    to: string,
  ): Promise<{ matched: number; pending: number }>;
}

export interface PrinterDriver {
  imprimir(
    ctx: ProviderContext,
    job: {
      type: "pedido" | "cozinha" | "bar" | "balcao" | "caixa" | "comprovante";
      payload: string;
    },
  ): Promise<{ jobId: string }>;
}

export interface DigitalMenuCapabilities {
  gerarQrCodeMesa(
    ctx: ProviderContext,
    mesaId: string,
  ): Promise<{ url: string; qrPayload: string }>;
  receberPedidoAutoatendimento(
    ctx: ProviderContext,
    payload: unknown,
  ): Promise<{ orderId: string }>;
}

/** Aliases legados Sprint 04 */
export type ProvedorIntegracao = IntegrationProviderId;
export type ResultadoTesteConexao = ConnectionTestResult;
export type PedidoExterno = ExternalOrder;

/** @deprecated use IntegrationProvider */
export type IntegracaoAdapter = IntegrationProvider & {
  provedor: IntegrationProviderId;
};

export const PROVEDORES_INTEGRACAO = PROVIDER_CATALOG.map((p) => ({
  value: p.id,
  label: p.label,
  category: p.category,
}));

export function isProviderId(value: string): value is IntegrationProviderId {
  return PROVIDER_CATALOG.some((p) => p.id === value);
}

export function catalogByCategory(
  category: IntegrationCategory,
): ProviderCatalogItem[] {
  return PROVIDER_CATALOG.filter((p) => p.category === category);
}
