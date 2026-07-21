import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub 99food — sem chamadas reais (homologação futura). */
export const noventaNoveFoodProvider: IntegrationProvider = createStubProvider(
  "99food",
  "delivery",
);
