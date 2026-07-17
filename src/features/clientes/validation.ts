import * as z from "zod";

export const SEGMENTO_CLIENTE_SUGESTOES = [
  "Novo",
  "Recorrente",
  "VIP",
  "Inativo",
] as const;

function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do cliente." }),
  telefone: campoOpcional(),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      error: "Informe um e-mail válido.",
    })
    .transform((value) => (value ? value : null)),
  documento: campoOpcional(),
  endereco: campoOpcional(),
  segmento: campoOpcional(),
  preferencias: campoOpcional(),
  observacoes: campoOpcional(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
