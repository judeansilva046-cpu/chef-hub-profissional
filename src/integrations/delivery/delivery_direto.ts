import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub delivery_direto — sem chamadas reais (homologação futura). */
export const deliveryDiretoProvider: IntegrationProvider = createStubProvider(
  "delivery_direto",
  "delivery",
);
