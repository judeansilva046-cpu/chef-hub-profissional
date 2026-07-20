import * as z from "zod";

export const credenciaisIntegracaoSchema = z.object({
  provedor: z.enum(["ifood", "99food", "keeta", "open_delivery"], {
    error: "Provedor inválido.",
  }),
  clientId: z.string().trim().min(1, { error: "Informe o Client ID." }),
  clientSecret: z.string().trim().min(1, { error: "Informe o Client Secret." }),
  // merchant/store ID da empresa NA plataforma — é o que o webhook usa para
  // descobrir de qual empresa é um pedido recebido (ver fn_resolver_
  // empresa_webhook_integracao). Opcional porque a conexão real ainda não
  // existe (sem credencial homologada de nenhum provedor).
  identificadorExterno: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type CredenciaisIntegracaoInput = z.infer<typeof credenciaisIntegracaoSchema>;
