import { createHomologProvider } from "../homolog/create-homolog-provider";
import { getIntegracoesMode } from "../mode";
import type { IntegrationProvider, PixGateway } from "../types";
import { IntegrationNotAvailableError } from "../types";

export const stoneProviderPix: PixGateway = {
  async gerarQrCode(ctx, input) {
    if (getIntegracoesMode() === "homolog") {
      return {
        qrCode: "PIX-HOMOLOG-stone-" + input.amount,
        txid: "stone_" + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }
    throw new IntegrationNotAvailableError("stone", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    if (getIntegracoesMode() === "homolog") return { status: "pending" };
    throw new IntegrationNotAvailableError("stone", "Consultar pagamento PIX");
  },
  async cancelar() {
    if (getIntegracoesMode() === "homolog") return;
    throw new IntegrationNotAvailableError("stone", "Cancelar PIX");
  },
  async processarWebhook() {},
  async conciliar() {
    return getIntegracoesMode() === "homolog"
      ? { matched: 0, pending: 0 }
      : { matched: 0, pending: 0 };
  },
};

export const stoneProvider: IntegrationProvider = createHomologProvider({
  id: "stone",
  category: "pix",
});
