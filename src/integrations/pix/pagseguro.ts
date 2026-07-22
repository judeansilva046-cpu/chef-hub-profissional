import { createHomologProvider } from "../homolog/create-homolog-provider";
import { getIntegracoesMode } from "../mode";
import type { IntegrationProvider, PixGateway } from "../types";
import { IntegrationNotAvailableError } from "../types";

export const pagseguroProviderPix: PixGateway = {
  async gerarQrCode(ctx, input) {
    if (getIntegracoesMode() === "homolog") {
      return {
        qrCode: "PIX-HOMOLOG-pagseguro-" + input.amount,
        txid: "pagseguro_" + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      };
    }
    throw new IntegrationNotAvailableError("pagseguro", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    if (getIntegracoesMode() === "homolog") return { status: "pending" };
    throw new IntegrationNotAvailableError("pagseguro", "Consultar pagamento PIX");
  },
  async cancelar() {
    if (getIntegracoesMode() === "homolog") return;
    throw new IntegrationNotAvailableError("pagseguro", "Cancelar PIX");
  },
  async processarWebhook() {},
  async conciliar() {
    return getIntegracoesMode() === "homolog"
      ? { matched: 0, pending: 0 }
      : { matched: 0, pending: 0 };
  },
};

export const pagseguroProvider: IntegrationProvider = createHomologProvider({
  id: "pagseguro",
  category: "pix",
});
