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

/** Plano de contas criado automaticamente para toda empresa nova (ver criarEmpresa) — mesmo seed aplicado a empresas já existentes na migration 0040. Contas de nível 2 (código com ponto) referenciam a conta-pai pelo código do nível 1. */
export const PLANO_CONTAS_PADRAO = [
  { codigo: "1", nome: "Receitas", tipo: "receita" as const, contaPaiCodigo: null },
  { codigo: "1.1", nome: "Vendas de Produtos", tipo: "receita" as const, contaPaiCodigo: "1" },
  { codigo: "1.2", nome: "Receitas Financeiras", tipo: "receita" as const, contaPaiCodigo: "1" },
  { codigo: "2", nome: "Custos e Despesas", tipo: "despesa" as const, contaPaiCodigo: null },
  { codigo: "2.1", nome: "CMV - Custo da Mercadoria Vendida", tipo: "despesa" as const, contaPaiCodigo: "2" },
  { codigo: "2.2", nome: "Despesas com Pessoal", tipo: "despesa" as const, contaPaiCodigo: "2" },
  { codigo: "2.3", nome: "Despesas Operacionais", tipo: "despesa" as const, contaPaiCodigo: "2" },
  { codigo: "2.4", nome: "Despesas Financeiras", tipo: "despesa" as const, contaPaiCodigo: "2" },
  { codigo: "2.5", nome: "Impostos e Taxas", tipo: "despesa" as const, contaPaiCodigo: "2" },
  { codigo: "3", nome: "Ativo Circulante", tipo: "ativo" as const, contaPaiCodigo: null },
  { codigo: "4", nome: "Passivo Circulante", tipo: "passivo" as const, contaPaiCodigo: null },
] as const;

/** Centros de custo criados automaticamente para toda empresa nova (ver criarEmpresa). */
export const CENTROS_CUSTO_PADRAO = [
  { codigo: "COZ", nome: "Cozinha" },
  { codigo: "SAL", nome: "Salão" },
  { codigo: "DEL", nome: "Delivery" },
  { codigo: "ADM", nome: "Administrativo" },
] as const;

function uuidOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const planoContaSchema = z.object({
  codigo: z.string().trim().min(1, { error: "Informe o código da conta." }),
  nome: z.string().trim().min(1, { error: "Informe o nome da conta." }),
  tipo: z.enum(["receita", "despesa", "ativo", "passivo"], {
    error: "Selecione o tipo da conta.",
  }),
  contaPaiId: uuidOpcional(),
});

export type PlanoContaInput = z.infer<typeof planoContaSchema>;

export const centroCustoSchema = z.object({
  codigo: z.string().trim().min(1, { error: "Informe o código do centro de custo." }),
  nome: z.string().trim().min(1, { error: "Informe o nome do centro de custo." }),
});

export type CentroCustoInput = z.infer<typeof centroCustoSchema>;

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
