import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PixGateway,
} from "../types";

export const stoneProviderPix: PixGateway = {
  async gerarQrCode() {
    throw new IntegrationNotAvailableError("stone", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    throw new IntegrationNotAvailableError("stone", "Consultar pagamento PIX");
  },
  async cancelar() {
    throw new IntegrationNotAvailableError("stone", "Cancelar PIX");
  },
  async processarWebhook() {
    throw new IntegrationNotAvailableError("stone", "Webhook PIX");
  },
  async conciliar() {
    throw new IntegrationNotAvailableError("stone", "Conciliação PIX");
  },
};

export const stoneProvider: IntegrationProvider = createStubProvider("stone", "pix");
