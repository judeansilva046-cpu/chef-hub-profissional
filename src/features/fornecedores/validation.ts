import * as z from "zod";

function optionalTrimmed() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

function optionalInteger() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null));
}

function optionalDecimal() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null));
}

export const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe a razão social do fornecedor." }),
  nomeFantasia: optionalTrimmed(),
  documento: optionalTrimmed(),
  inscricaoEstadual: optionalTrimmed(),
  telefone: optionalTrimmed(),
  whatsapp: optionalTrimmed(),
  contatoNome: optionalTrimmed(),
  email: z
    .email({ error: "Informe um e-mail válido." })
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  endereco: optionalTrimmed(),
  categorias: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) =>
      value ? Array.from(new Set(value.split(",").map((c) => c.trim()).filter(Boolean))) : [],
    ),
  condicoesPagamento: optionalTrimmed(),
  prazoMedioEntregaDias: optionalInteger(),
  pedidoMinimo: optionalDecimal(),
  banco: optionalTrimmed(),
  agencia: optionalTrimmed(),
  conta: optionalTrimmed(),
  tipoConta: optionalTrimmed(),
  chavePix: optionalTrimmed(),
  observacoes: optionalTrimmed(),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;

export const CATEGORIA_FORNECEDOR_SUGESTOES = [
  "Hortifruti",
  "Proteínas",
  "Laticínios",
  "Bebidas",
  "Embalagens",
  "Limpeza",
  "Descartáveis",
] as const;

export const avaliacaoFornecedorSchema = z.object({
  fornecedorId: z.string().uuid({ error: "Fornecedor inválido." }),
  pedidoId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  pontualidade: z.coerce.number().int().min(1).max(5),
  qualidade: z.coerce.number().int().min(1).max(5),
  preco: z.coerce.number().int().min(1).max(5),
  atendimento: z.coerce.number().int().min(1).max(5),
  comentario: optionalTrimmed(),
});
