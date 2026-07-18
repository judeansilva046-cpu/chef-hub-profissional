import * as z from "zod";

export const abrirCaixaSchema = z.object({
  saldoInicial: z.coerce.number().min(0, { error: "O saldo inicial não pode ser negativo." }),
  observacoes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export const TIPOS_MOVIMENTACAO_MANUAL = ["entrada", "sangria", "suprimento"] as const;

export const movimentacaoCaixaSchema = z.object({
  tipo: z.enum(TIPOS_MOVIMENTACAO_MANUAL, { error: "Selecione o tipo de movimentação." }),
  valor: z.coerce.number().positive({ error: "O valor deve ser maior que zero." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export const fecharCaixaSchema = z.object({
  saldoInformado: z.coerce.number().min(0, { error: "Informe o saldo contado." }),
  observacoes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
