import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub keeta — sem chamadas reais (homologação futura). */
export const keetaProvider: IntegrationProvider = createStubProvider(
  "keeta",
  "delivery",
);
