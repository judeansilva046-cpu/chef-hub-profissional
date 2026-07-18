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

export const FORMAS_RECEBIMENTO = ["pix", "cartao", "dinheiro", "boleto", "transferencia"] as const;

export const contaReceberSchema = z.object({
  descricao: z.string().trim().min(1, { error: "Informe a descrição." }),
  clienteId: uuidOpcional(),
  planoContaId: uuidOpcional(),
  centroCustoId: uuidOpcional(),
  valorTotal: z.coerce.number({ error: "Informe um valor válido." }).positive({ error: "O valor deve ser maior que zero." }),
  numeroParcelas: z.coerce.number().int().min(1, { error: "Ao menos 1 parcela." }).max(48, { error: "No máximo 48 parcelas." }),
  primeiraDataVencimento: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione a data do primeiro vencimento." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
export type ContaReceberInput = z.infer<typeof contaReceberSchema>;

export const recebimentoParcelaSchema = z.object({
  valorRecebido: z.coerce.number({ error: "Informe um valor válido." }).positive({ error: "O valor deve ser maior que zero." }),
  formaPagamento: z.enum(FORMAS_RECEBIMENTO, { error: "Selecione a forma de recebimento." }),
  dataRecebimento: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione a data do recebimento." }),
});
export type RecebimentoParcelaInput = z.infer<typeof recebimentoParcelaSchema>;

export const cancelamentoContaReceberSchema = z.object({
  motivo: z.string().trim().min(3, { error: "Informe o motivo do cancelamento." }),
});
