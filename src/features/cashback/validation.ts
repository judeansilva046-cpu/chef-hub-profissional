import * as z from "zod";

export const configCashbackSchema = z.object({
  ativo: z
    .union([z.literal("on"), z.literal(""), z.undefined()])
    .transform((value) => value === "on"),
  tipo: z.enum(["percentual", "fixo"]),
  percentual: z.coerce.number().min(0).max(100),
  valorFixo: z.coerce.number().min(0),
  limitePorVenda: z.coerce.number().min(0),
  validadeDias: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null)),
});

export const movimentacaoCashbackSchema = z.object({
  clienteId: z.string().uuid({ error: "Cliente inválido." }),
  valor: z.coerce.number().positive({ error: "Informe um valor maior que zero." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
