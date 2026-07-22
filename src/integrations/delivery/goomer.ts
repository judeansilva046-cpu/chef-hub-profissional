import { createHomologProvider } from "../homolog/create-homolog-provider";
import type { IntegrationProvider } from "../types";

export const goomerProvider: IntegrationProvider = createHomologProvider({
  id: "goomer",
  category: "delivery",
});
