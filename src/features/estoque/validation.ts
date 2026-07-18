import * as z from "zod";

export const entradaEstoqueSchema = z.object({
  ingredienteId: z
    .string()
    .trim()
    .min(1, { error: "Selecione o ingrediente." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  custoUnitario: z.coerce
    .number({ error: "Informe um custo válido." })
    .min(0, { error: "O custo não pode ser negativo." }),
  numeroLote: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  dataValidade: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type EntradaEstoqueInput = z.infer<typeof entradaEstoqueSchema>;

export const saidaEstoqueSchema = z.object({
  ingredienteId: z
    .string()
    .trim()
    .min(1, { error: "Selecione o ingrediente." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type SaidaEstoqueInput = z.infer<typeof saidaEstoqueSchema>;

export const ajusteEstoqueSchema = z.object({
  ingredienteId: z
    .string()
    .trim()
    .min(1, { error: "Selecione o ingrediente." }),
  direcao: z.enum(["entrada", "saida"], {
    error: "Selecione o sentido do ajuste.",
  }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  observacao: z
    .string()
    .trim()
    .min(1, { error: "Descreva o motivo do ajuste." }),
});

export type AjusteEstoqueInput = z.infer<typeof ajusteEstoqueSchema>;

export const novoInventarioSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe um nome para o inventário." }),
});

export type NovoInventarioInput = z.infer<typeof novoInventarioSchema>;
