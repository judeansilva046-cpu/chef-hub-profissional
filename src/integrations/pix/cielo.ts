import { createHomologProvider } from "../homolog/create-homolog-provider";
import { getIntegracoesMode } from "../mode";
import type { IntegrationProvider, PixGateway } from "../types";
import { IntegrationNotAvailableError } from "../types";

export const cieloProviderPix: PixGateway = {
  async gerarQrCode(ctx, input) {
    if (getIntegracoesMode() === "homolog") {
      return {
        qrCode: "PIX-HOMOLOG-cielo-" + input.amount,
        txid: "cielo_" + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }
    throw new IntegrationNotAvailableError("cielo", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    if (getIntegracoesMode() === "homolog") return { status: "pending" };
    throw new IntegrationNotAvailableError("cielo", "Consultar pagamento PIX");
  },
  async cancelar() {
    if (getIntegracoesMode() === "homolog") return;
    throw new IntegrationNotAvailableError("cielo", "Cancelar PIX");
  },
  async processarWebhook() {},
  async conciliar() {
    return getIntegracoesMode() === "homolog"
      ? { matched: 0, pending: 0 }
      : { matched: 0, pending: 0 };
  },
};

export const cieloProvider: IntegrationProvider = createHomologProvider({
  id: "cielo",
  category: "pix",
});
