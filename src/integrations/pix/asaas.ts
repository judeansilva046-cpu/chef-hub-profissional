import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PixGateway,
} from "../types";

export const asaasProviderPix: PixGateway = {
  async gerarQrCode() {
    throw new IntegrationNotAvailableError("asaas", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    throw new IntegrationNotAvailableError("asaas", "Consultar pagamento PIX");
  },
  async cancelar() {
    throw new IntegrationNotAvailableError("asaas", "Cancelar PIX");
  },
  async processarWebhook() {
    throw new IntegrationNotAvailableError("asaas", "Webhook PIX");
  },
  async conciliar() {
    throw new IntegrationNotAvailableError("asaas", "Conciliação PIX");
  },
};

export const asaasProvider: IntegrationProvider = createStubProvider("asaas", "pix");
