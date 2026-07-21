import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type DigitalMenuCapabilities,
  type IntegrationProvider,
} from "../types";

export const cardapioDigitalMenu: DigitalMenuCapabilities = {
  async gerarQrCodeMesa() {
    throw new IntegrationNotAvailableError("cardapio_digital", "QR Code mesa");
  },
  async receberPedidoAutoatendimento() {
    throw new IntegrationNotAvailableError(
      "cardapio_digital",
      "Pedido autoatendimento",
    );
  },
};

export const cardapioDigitalProvider: IntegrationProvider = createStubProvider(
  "cardapio_digital",
  "cardapio_digital",
);
