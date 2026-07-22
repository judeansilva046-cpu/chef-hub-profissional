import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const anotaAiProvider: IntegrationProvider = createHomologProvider({
  id: "anota_ai",
  category: "delivery",
});
