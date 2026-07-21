import { ifoodProvider } from "./delivery/ifood";
import { anotaAiProvider } from "./delivery/anota_ai";
import { deliveryDiretoProvider } from "./delivery/delivery_direto";
import { goomerProvider } from "./delivery/goomer";
import { cardapioWebProvider } from "./delivery/cardapio_web";
import { noventaNoveFoodProvider } from "./delivery/99food";
import { keetaProvider } from "./delivery/keeta";
import { openDeliveryProvider } from "./delivery/open_delivery";
import { whatsappCloudProvider } from "./whatsapp/whatsapp_cloud";
import { evolutionApiProvider } from "./whatsapp/evolution_api";
import { mercadoPagoProvider } from "./pix/mercado_pago";
import { asaasProvider } from "./pix/asaas";
import { pagseguroProvider } from "./pix/pagseguro";
import { stoneProvider } from "./pix/stone";
import { cieloProvider } from "./pix/cielo";
import { epsonProvider } from "./printers/epson";
import { elginProvider } from "./printers/elgin";
import { bematechProvider } from "./printers/bematech";
import { escposProvider } from "./printers/escpos";
import { cardapioDigitalProvider } from "./cardapio-digital/cardapio_digital";
import type { IntegrationProvider, IntegrationProviderId } from "./types";
import { isProviderId } from "./types";

const REGISTRY: Record<IntegrationProviderId, IntegrationProvider> = {
  "ifood": ifoodProvider,
  "anota_ai": anotaAiProvider,
  "delivery_direto": deliveryDiretoProvider,
  "goomer": goomerProvider,
  "cardapio_web": cardapioWebProvider,
  "99food": noventaNoveFoodProvider,
  "keeta": keetaProvider,
  "open_delivery": openDeliveryProvider,
  "whatsapp_cloud": whatsappCloudProvider,
  "evolution_api": evolutionApiProvider,
  "mercado_pago": mercadoPagoProvider,
  "asaas": asaasProvider,
  "pagseguro": pagseguroProvider,
  "stone": stoneProvider,
  "cielo": cieloProvider,
  "epson": epsonProvider,
  "elgin": elginProvider,
  "bematech": bematechProvider,
  "escpos": escposProvider,
  "cardapio_digital": cardapioDigitalProvider,
};

export function obterProvider(provider: IntegrationProviderId): IntegrationProvider {
  return REGISTRY[provider];
}

/** @deprecated use obterProvider */
export function obterAdapter(provedor: IntegrationProviderId): IntegrationProvider {
  return obterProvider(provedor);
}

export function listarProviders(): IntegrationProvider[] {
  return Object.values(REGISTRY);
}

export function resolverProvider(id: string): IntegrationProvider | null {
  if (!isProviderId(id)) return null;
  return REGISTRY[id];
}
