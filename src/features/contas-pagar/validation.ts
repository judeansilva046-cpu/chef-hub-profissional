import * as z from "zod";

function uuidOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const FORMAS_PAGAMENTO_CONTA_PAGAR = ["pix", "boleto", "dinheiro", "cartao", "transferencia"] as const;

export const contaPagarSchema = z.object({
  descricao: z.string().trim().min(1, { error: "Informe a descrição." }),
  fornecedorId: uuidOpcional(),
  planoContaId: uuidOpcional(),
  centroCustoId: uuidOpcional(),
  numeroDocumento: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  valor: z.coerce.number({ error: "Informe um valor válido." }).positive({ error: "O valor deve ser maior que zero." }),
  dataVencimento: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione a data de vencimento." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
export type ContaPagarInput = z.infer<typeof contaPagarSchema>;

export const pagamentoContaPagarSchema = z.object({
  valorPago: z.coerce.number({ error: "Informe um valor válido." }).positive({ error: "O valor deve ser maior que zero." }),
  formaPagamento: z.enum(FORMAS_PAGAMENTO_CONTA_PAGAR, { error: "Selecione a forma de pagamento." }),
  dataPagamento: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione a data do pagamento." }),
});
export type PagamentoContaPagarInput = z.infer<typeof pagamentoContaPagarSchema>;

export const cancelamentoContaPagarSchema = z.object({
  motivo: z.string().trim().min(3, { error: "Informe o motivo do cancelamento." }),
});
