import { novantaENoveFoodAdapter } from "./99food/adapter";
import { ifoodAdapter } from "./ifood/adapter";
import { keetaAdapter } from "./keeta/adapter";
import { openDeliveryAdapter } from "./open-delivery/adapter";
import type { IntegracaoAdapter, ProvedorIntegracao } from "./types";

const REGISTRO: Record<ProvedorIntegracao, IntegracaoAdapter> = {
  ifood: ifoodAdapter,
  "99food": novantaENoveFoodAdapter,
  keeta: keetaAdapter,
  open_delivery: openDeliveryAdapter,
};

export function obterAdapter(provedor: ProvedorIntegracao): IntegracaoAdapter {
  return REGISTRO[provedor];
}
