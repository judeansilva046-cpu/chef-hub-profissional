import * as z from "zod";

export const credenciaisIntegracaoSchema = z.object({
  provedor: z.enum(["ifood", "99food", "keeta", "open_delivery"], {
    error: "Provedor inválido.",
  }),
  clientId: z.string().trim().min(1, { error: "Informe o Client ID." }),
  clientSecret: z.string().trim().min(1, { error: "Informe o Client Secret." }),
});

export type CredenciaisIntegracaoInput = z.infer<typeof credenciaisIntegracaoSchema>;
