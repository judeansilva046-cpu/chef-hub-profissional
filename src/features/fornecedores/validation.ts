import * as z from "zod";

function optionalTrimmed() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do fornecedor." }),
  documento: optionalTrimmed(),
  telefone: optionalTrimmed(),
  email: z
    .email({ error: "Informe um e-mail válido." })
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  endereco: optionalTrimmed(),
  observacoes: optionalTrimmed(),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;
