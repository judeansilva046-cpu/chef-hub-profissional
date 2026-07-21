import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub anota_ai — sem chamadas reais (homologação futura). */
export const anotaAiProvider: IntegrationProvider = createStubProvider(
  "anota_ai",
  "delivery",
);
