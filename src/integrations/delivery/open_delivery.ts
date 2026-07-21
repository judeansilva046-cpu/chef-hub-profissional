import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub open_delivery — sem chamadas reais (homologação futura). */
export const openDeliveryProvider: IntegrationProvider = createStubProvider(
  "open_delivery",
  "delivery",
);
