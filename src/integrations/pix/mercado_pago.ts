import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type PixGateway,
} from "../types";

export const mercadoPagoProviderPix: PixGateway = {
  async gerarQrCode() {
    throw new IntegrationNotAvailableError("mercado_pago", "Gerar QR Code PIX");
  },
  async consultarPagamento() {
    throw new IntegrationNotAvailableError("mercado_pago", "Consultar pagamento PIX");
  },
  async cancelar() {
    throw new IntegrationNotAvailableError("mercado_pago", "Cancelar PIX");
  },
  async processarWebhook() {
    throw new IntegrationNotAvailableError("mercado_pago", "Webhook PIX");
  },
  async conciliar() {
    throw new IntegrationNotAvailableError("mercado_pago", "Conciliação PIX");
  },
};

export const mercadoPagoProvider: IntegrationProvider = createStubProvider("mercado_pago", "pix");
