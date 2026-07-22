import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const keetaProvider: IntegrationProvider = createHomologProvider({
  id: "keeta",
  category: "delivery",
});
