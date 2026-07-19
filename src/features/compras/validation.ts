import * as z from "zod";

export const solicitacaoItemSchema = z.object({
  ingredienteId: z.string().min(1, { error: "Selecione um ingrediente." }),
  quantidade: z
    .number({ error: "Informe a quantidade." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  precoEstimado: z.number().min(0).nullable(),
});

export const PRIORIDADE_SOLICITACAO = ["baixa", "normal", "alta", "urgente"] as const;

export const solicitacaoCompraSchema = z.object({
  observacao: z.string().trim().nullable(),
  setor: z.string().trim().nullable(),
  centroCustoId: z.string().nullable(),
  prioridade: z.enum(PRIORIDADE_SOLICITACAO).default("normal"),
  justificativa: z.string().trim().nullable(),
  dataNecessaria: z.string().trim().nullable(),
  itens: z
    .array(solicitacaoItemSchema)
    .min(1, { error: "Adicione ao menos um item." }),
});

export type SolicitacaoCompraInput = z.infer<typeof solicitacaoCompraSchema>;

export const pedidoItemSchema = z.object({
  ingredienteId: z.string().min(1, { error: "Selecione um ingrediente." }),
  quantidade: z
    .number({ error: "Informe a quantidade." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  precoUnitario: z
    .number({ error: "Informe o preço unitário." })
    .min(0, { error: "O preço não pode ser negativo." }),
});

export const pedidoCompraSchema = z.object({
  fornecedorId: z.string().min(1, { error: "Selecione o fornecedor." }),
  dataPrevistaEntrega: z.string().trim().nullable(),
  observacao: z.string().trim().nullable(),
  solicitacaoOrigemId: z.string().nullable(),
  centroCustoId: z.string().nullable(),
  planoContaId: z.string().nullable(),
  descontoPercentual: z.number().min(0).max(100).default(0),
  descontoValorFixo: z.number().min(0).default(0),
  valorFrete: z.number().min(0).default(0),
  valorImpostos: z.number().min(0).default(0),
  condicaoPagamento: z.string().trim().nullable(),
  numeroParcelas: z.number().int().positive().default(1),
  itens: z
    .array(pedidoItemSchema)
    .min(1, { error: "Adicione ao menos um item." }),
});

export type PedidoCompraInput = z.infer<typeof pedidoCompraSchema>;

export const registrarRecebimentoItemSchema = z
  .object({
    pedidoItemId: z.string().min(1),
    quantidadeRecebida: z.number().min(0).default(0),
    quantidadeRecusada: z.number().min(0).default(0),
    precoConferido: z.number().min(0).nullable(),
    numeroLote: z.string().trim().nullable(),
    dataFabricacao: z.string().trim().nullable(),
    dataValidade: z.string().trim().nullable(),
    motivoDivergencia: z.string().trim().nullable(),
  })
  .refine((data) => data.quantidadeRecebida > 0 || data.quantidadeRecusada > 0, {
    error: "Informe alguma quantidade recebida ou recusada.",
    path: ["quantidadeRecebida"],
  })
  .refine(
    (data) => data.quantidadeRecusada === 0 || Boolean(data.motivoDivergencia),
    { error: "Informe o motivo da recusa.", path: ["motivoDivergencia"] },
  );

function optionalTexto() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

function optionalInteiro() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null));
}

function optionalNumero() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null));
}

export const precoFornecedorSchema = z.object({
  ingredienteId: z.string().min(1),
  fornecedorId: z.string().min(1, { error: "Selecione o fornecedor." }),
  precoUnitario: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
  codigoFornecedor: optionalTexto(),
  unidadeCompraId: optionalTexto(),
  fatorConversao: z.coerce.number().positive().default(1),
  marca: optionalTexto(),
  embalagem: optionalTexto(),
  quantidadeEmbalagem: z.coerce.number().positive().default(1),
  prazoEntregaDias: optionalInteiro(),
  pedidoMinimo: optionalNumero(),
  preferencial: z
    .union([z.literal("on"), z.literal(""), z.undefined(), z.null()])
    .transform((value) => value === "on"),
});

export const PAPEL_APROVADOR = ["owner", "aprovador"] as const;

export const nivelAprovacaoSchema = z
  .object({
    nome: z.string().trim().min(1, { error: "Informe um nome para a faixa." }),
    valorMinimo: z.coerce.number().min(0).default(0),
    valorMaximo: optionalNumero(),
    centroCustoId: optionalTexto(),
    papelAprovador: z
      .union([z.enum(PAPEL_APROVADOR), z.literal(""), z.null(), z.undefined()])
      .transform((value) => (value ? value : null)),
    usuarioAprovadorId: optionalTexto(),
    ordem: z.coerce.number().int().default(0),
    ativo: z
      .union([z.literal("on"), z.literal(""), z.undefined(), z.null()])
      .transform((value) => value === "on"),
  })
  .refine((data) => data.papelAprovador !== null || data.usuarioAprovadorId !== null, {
    error: "Escolha um papel aprovador ou um usuário específico.",
    path: ["papelAprovador"],
  })
  .refine(
    (data) => data.valorMaximo === null || data.valorMaximo >= data.valorMinimo,
    { error: "O valor máximo deve ser maior ou igual ao mínimo.", path: ["valorMaximo"] },
  );

export const cotacaoItemSchema = z.object({
  ingredienteId: z.string().min(1, { error: "Selecione um ingrediente." }),
  quantidade: z
    .number({ error: "Informe a quantidade." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
});

export const cotacaoSchema = z.object({
  solicitacaoOrigemId: z.string().nullable(),
  observacao: z.string().trim().nullable(),
  itens: z.array(cotacaoItemSchema).min(1, { error: "Adicione ao menos um item." }),
  fornecedorIds: z
    .array(z.string().min(1))
    .min(1, { error: "Convide ao menos um fornecedor." }),
});

export const propostaItemSchema = z.object({
  cotacaoItemId: z.string().min(1),
  precoUnitario: z.coerce.number().min(0),
  atendePedidoMinimo: z.boolean().default(true),
});

export const propostaFornecedorSchema = z.object({
  prazoEntregaDias: optionalInteiro(),
  condicaoPagamento: optionalTexto(),
  valorFrete: z.coerce.number().min(0).default(0),
  valorImpostos: z.coerce.number().min(0).default(0),
  pedidoMinimo: optionalNumero(),
  observacao: optionalTexto(),
  itens: z.array(propostaItemSchema),
});
