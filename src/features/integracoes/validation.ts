import * as z from "zod";

import { PROVIDER_CATALOG } from "@/integrations/types";

const providerIds = PROVIDER_CATALOG.map((p) => p.id) as [
  (typeof PROVIDER_CATALOG)[number]["id"],
  ...(typeof PROVIDER_CATALOG)[number]["id"][],
];

export const credenciaisIntegracaoSchema = z.object({
  provedor: z.enum(providerIds, { error: "Provedor inválido." }),
  clientId: z.string().trim().min(1, { error: "Informe o Client ID / API Key." }),
  clientSecret: z
    .string()
    .trim()
    .min(1, { error: "Informe o Client Secret / Token." }),
  webhookSecret: z.string().trim().optional(),
});

export type CredenciaisIntegracaoInput = z.infer<
  typeof credenciaisIntegracaoSchema
>;

export const syncIntegracaoSchema = z.object({
  integrationId: z.string().uuid({ error: "Integração inválida." }),
  syncType: z.enum(["pedidos", "produtos"], {
    error: "Tipo de sincronização inválido.",
  }),
});
