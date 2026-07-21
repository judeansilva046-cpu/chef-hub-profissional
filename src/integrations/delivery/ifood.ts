import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub ifood — sem chamadas reais (homologação futura). */
export const ifoodProvider: IntegrationProvider = createStubProvider(
  "ifood",
  "delivery",
);
