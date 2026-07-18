import * as z from "zod";

function optionalTrimmed() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const solicitacaoItemSchema = z.object({
  ingredienteId: z.string().min(1, { error: "Selecione um ingrediente." }),
  quantidade: z
    .number({ error: "Informe a quantidade." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
});

export const solicitacaoCompraSchema = z.object({
  observacao: z.string().trim().nullable(),
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
  itens: z
    .array(pedidoItemSchema)
    .min(1, { error: "Adicione ao menos um item." }),
});

export type PedidoCompraInput = z.infer<typeof pedidoCompraSchema>;

export const receberItemPedidoSchema = z.object({
  pedidoItemId: z.string().min(1),
  quantidade: z.coerce
    .number({ error: "Informe a quantidade recebida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  numeroLote: optionalTrimmed(),
  dataValidade: optionalTrimmed(),
});

export const precoFornecedorSchema = z.object({
  ingredienteId: z.string().min(1),
  fornecedorId: z.string().min(1, { error: "Selecione o fornecedor." }),
  precoUnitario: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
});
