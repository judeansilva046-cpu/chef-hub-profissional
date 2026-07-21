import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PixGateway,
} from "../types";

export const pagseguroProviderPix: PixGateway = {
  async gerarQrCode() {
    throw new IntegrationNotAvailableError("pagseguro", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    throw new IntegrationNotAvailableError("pagseguro", "Consultar pagamento PIX");
  },
  async cancelar() {
    throw new IntegrationNotAvailableError("pagseguro", "Cancelar PIX");
  },
  async processarWebhook() {
    throw new IntegrationNotAvailableError("pagseguro", "Webhook PIX");
  },
  async conciliar() {
    throw new IntegrationNotAvailableError("pagseguro", "Conciliação PIX");
  },
};

export const pagseguroProvider: IntegrationProvider = createStubProvider("pagseguro", "pix");
