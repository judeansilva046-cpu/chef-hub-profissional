import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PixGateway,
} from "../types";

export const cieloProviderPix: PixGateway = {
  async gerarQrCode() {
    throw new IntegrationNotAvailableError("cielo", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    throw new IntegrationNotAvailableError("cielo", "Consultar pagamento PIX");
  },
  async cancelar() {
    throw new IntegrationNotAvailableError("cielo", "Cancelar PIX");
  },
  async processarWebhook() {
    throw new IntegrationNotAvailableError("cielo", "Webhook PIX");
  },
  async conciliar() {
    throw new IntegrationNotAvailableError("cielo", "Conciliação PIX");
  },
};

export const cieloProvider: IntegrationProvider = createStubProvider("cielo", "pix");
