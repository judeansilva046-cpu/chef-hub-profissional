import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const openDeliveryProvider: IntegrationProvider = createHomologProvider({
  id: "open_delivery",
  category: "delivery",
});
