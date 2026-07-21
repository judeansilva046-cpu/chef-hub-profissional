import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub cardapio_web — sem chamadas reais (homologação futura). */
export const cardapioWebProvider: IntegrationProvider = createStubProvider(
  "cardapio_web",
  "delivery",
);
