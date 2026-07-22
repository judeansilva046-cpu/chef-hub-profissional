import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const cardapioWebProvider: IntegrationProvider = createHomologProvider({
  id: "cardapio_web",
  category: "delivery",
});
