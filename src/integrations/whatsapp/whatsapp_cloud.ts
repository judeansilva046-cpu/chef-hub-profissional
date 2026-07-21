import { createStubProvider } from "../create-stub-provider";
import {
  IntegrationNotAvailableError,
  type IntegrationProvider,
  type WhatsAppCapabilities,
} from "../types";

export const whatsappCloudProviderWhatsApp: WhatsAppCapabilities = {
  async enviarMensagem() {
    throw new IntegrationNotAvailableError("whatsapp_cloud", "Enviar mensagem WhatsApp");
  },
  async enviarTemplate() {
    throw new IntegrationNotAvailableError("whatsapp_cloud", "Enviar template WhatsApp");
  },
  async notificarStatusPedido() {
    throw new IntegrationNotAvailableError("whatsapp_cloud", "Notificar status WhatsApp");
  },
};

export const whatsappCloudProvider: IntegrationProvider = createStubProvider("whatsapp_cloud", "whatsapp");
