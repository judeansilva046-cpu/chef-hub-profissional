import { createHomologProvider } from "../homolog/create-homolog-provider";
import type {
  DigitalMenuCapabilities,
  IntegrationProvider,
  ProviderContext,
} from "../types";

export const cardapioDigitalMenu: DigitalMenuCapabilities = {
  async gerarQrCodeMesa(ctx: ProviderContext, mesaId: string) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3010";
    const url = `${base}/cardapio/${ctx.empresaId}/mesa/${mesaId}`;
    return {
      url,
      qrPayload: url,
    };
  },

  async receberPedidoAutoatendimento(ctx, payload) {
    const body = payload as {
      items?: Array<{ name: string; qty: number }>;
      mesaId?: string;
    };
    const orderId = `menu_${ctx.empresaId.slice(0, 8)}_${Date.now()}`;
    void body;
    return { orderId };
  },
};

export const cardapioDigitalProvider: IntegrationProvider = createHomologProvider({
  id: "cardapio_digital",
  category: "cardapio_digital",
});
