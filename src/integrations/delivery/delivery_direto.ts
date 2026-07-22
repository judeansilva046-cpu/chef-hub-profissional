import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const deliveryDiretoProvider: IntegrationProvider = createHomologProvider({
  id: "delivery_direto",
  category: "delivery",
});
