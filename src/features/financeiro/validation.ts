import * as z from "zod";

export const CATEGORIA_CUSTO_FIXO_OPCOES = [
  { value: "aluguel", label: "Aluguel" },
  { value: "salarios", label: "Salários" },
  { value: "utilidades", label: "Água, luz, internet" },
  { value: "seguros", label: "Seguros" },
  { value: "software", label: "Softwares e assinaturas" },
  { value: "outros", label: "Outros" },
] as const;

export const custoFixoSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do custo." }),
  categoria: z.enum(
    ["aluguel", "salarios", "utilidades", "seguros", "software", "outros"],
    { error: "Selecione uma categoria." },
  ),
  valorMensal: z.coerce
    .number({ error: "Informe um valor válido." })
    .min(0, { error: "O valor não pode ser negativo." }),
});

export type CustoFixoInput = z.infer<typeof custoFixoSchema>;

export const custoVariavelSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do custo." }),
  tipo: z.enum(["percentual_sobre_venda", "valor_fixo_por_venda"], {
    error: "Selecione o tipo do custo.",
  }),
  valor: z.coerce
    .number({ error: "Informe um valor válido." })
    .min(0, { error: "O valor não pode ser negativo." }),
});

export type CustoVariavelInput = z.infer<typeof custoVariavelSchema>;

export const metaVendasSchema = z.object({
  mesReferencia: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, { error: "Selecione o mês de referência." }),
  valorMetaReceita: z.coerce
    .number({ error: "Informe um valor de meta válido." })
    .positive({ error: "A meta de faturamento deve ser maior que zero." }),
  quantidadeMeta: z.coerce
    .number()
    .min(0, { error: "A quantidade não pode ser negativa." })
    .nullable(),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type MetaVendasInput = z.infer<typeof metaVendasSchema>;

/** Canais criados automaticamente para toda empresa nova (ver criarEmpresa em features/empresa/actions.ts) — taxa 0, o usuário configura depois. */
export const CANAIS_VENDA_PADRAO = [
  { tipo: "ifood", nome: "iFood" },
  { tipo: "99food", nome: "99Food" },
  { tipo: "keeta", nome: "Keeta" },
  { tipo: "proprio", nome: "Delivery Próprio" },
] as const;

export const TIPO_CANAL_OPCOES = [
  { value: "ifood", label: "iFood" },
  { value: "99food", label: "99Food" },
  { value: "keeta", label: "Keeta" },
  { value: "proprio", label: "Delivery Próprio" },
  { value: "personalizado", label: "Canal personalizado" },
] as const;

export const canalVendaSchema = z.object({
  tipo: z.enum(["ifood", "99food", "keeta", "proprio", "personalizado"], {
    error: "Selecione o tipo do canal.",
  }),
  nome: z.string().trim().min(1, { error: "Informe o nome do canal." }),
  taxaPercentual: z.coerce
    .number({ error: "Informe uma taxa válida." })
    .min(0, { error: "A taxa não pode ser negativa." })
    .max(100, { error: "A taxa não pode passar de 100%." }),
  taxaFixa: z.coerce
    .number({ error: "Informe um valor válido." })
    .min(0, { error: "O valor não pode ser negativo." }),
});

export type CanalVendaInput = z.infer<typeof canalVendaSchema>;
