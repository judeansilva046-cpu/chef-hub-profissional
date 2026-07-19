import * as z from "zod";

export const configFidelidadeSchema = z.object({
  ativo: z
    .union([z.literal("on"), z.literal(""), z.undefined()])
    .transform((value) => value === "on"),
  pontosPorValor: z.coerce.number().min(0, { error: "Informe um valor válido." }),
  valorPontoResgate: z.coerce.number().min(0, { error: "Informe um valor válido." }),
  validadeDias: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null)),
});

export const nivelFidelidadeSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do nível." }),
  pontosMinimos: z.coerce.number().min(0, { error: "Informe um valor válido." }),
  beneficios: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  ordem: z.coerce.number().int().default(0),
});

export const movimentacaoPontosSchema = z.object({
  clienteId: z.string().uuid({ error: "Cliente inválido." }),
  pontos: z.coerce.number().positive({ error: "Informe uma quantidade de pontos maior que zero." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
