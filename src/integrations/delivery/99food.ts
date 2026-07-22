import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const noventaNoveFoodProvider: IntegrationProvider = createHomologProvider({
  id: "99food",
  category: "delivery",
});
