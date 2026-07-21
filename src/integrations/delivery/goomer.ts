import { createStubProvider } from "../create-stub-provider";
import type { IntegrationProvider } from "../types";

/** Stub goomer — sem chamadas reais (homologação futura). */
export const goomerProvider: IntegrationProvider = createStubProvider(
  "goomer",
  "delivery",
);
