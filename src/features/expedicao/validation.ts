import * as z from "zod";

export const entregadorSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do entregador." }),
  telefone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  veiculo: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
