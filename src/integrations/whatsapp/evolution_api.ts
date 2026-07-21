import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type WhatsAppCapabilities,
} from "../types";

export const evolutionApiProviderWhatsApp: WhatsAppCapabilities = {
  async enviarMensagem() {
    throw new IntegrationNotAvailableError("evolution_api", "Enviar mensagem WhatsApp");
  },
  async enviarTemplate() {
    throw new IntegrationNotAvailableError("evolution_api", "Enviar template WhatsApp");
  },
  async notificarStatusPedido() {
    throw new IntegrationNotAvailableError("evolution_api", "Notificar status WhatsApp");
  },
};

export const evolutionApiProvider: IntegrationProvider = createStubProvider("evolution_api", "whatsapp");
