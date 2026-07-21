import * as z from "zod";

export const contaPagarSchema = z.object({
  description: z.string().trim().min(1, { error: "Informe a descrição." }),
  amount: z.coerce.number().positive({ error: "Valor deve ser positivo." }),
  competenceDate: z.string().min(1, { error: "Informe a competência." }),
  dueDate: z.string().min(1, { error: "Informe o vencimento." }),
  fornecedorId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional().nullable(),
  interestAmount: z.coerce.number().min(0).optional().default(0),
  fineAmount: z.coerce.number().min(0).optional().default(0),
  installmentTotal: z.coerce.number().int().min(1).max(60).optional().default(1),
  attachmentUrl: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const contaReceberSchema = z.object({
  description: z.string().trim().min(1, { error: "Informe a descrição." }),
  amount: z.coerce.number().positive({ error: "Valor deve ser positivo." }),
  competenceDate: z.string().min(1, { error: "Informe a competência." }),
  dueDate: z.string().min(1, { error: "Informe o vencimento." }),
  clienteId: z.string().uuid().optional().nullable(),
  pedidoId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional().nullable(),
  source: z
    .enum(["delivery", "mesa", "pix", "cartao", "dinheiro", "marketplace", "outro"])
    .optional()
    .default("outro"),
  interestAmount: z.coerce.number().min(0).optional().default(0),
  fineAmount: z.coerce.number().min(0).optional().default(0),
  installmentTotal: z.coerce.number().int().min(1).max(60).optional().default(1),
  autoSettle: z.coerce.boolean().optional().default(false),
  notes: z.string().trim().optional().nullable(),
});

export const baixaSchema = z.object({
  id: z.string().uuid(),
  valor: z.coerce.number().positive({ error: "Informe o valor da baixa." }),
  bankAccountId: z.string().uuid().optional().nullable(),
});

export const cashFlowSchema = z.object({
  flowDate: z.string().min(1),
  tipo: z.enum(["entrada", "saida"]),
  amount: z.coerce.number().positive(),
  description: z.string().trim().min(1),
  categoryId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  bankAccountId: z.string().uuid().optional().nullable(),
});

export const bankTxSchema = z.object({
  bankAccountId: z.string().uuid(),
  txDate: z.string().min(1),
  tipo: z.enum(["credito", "debito"]),
  amount: z.coerce.number().positive(),
  description: z.string().trim().min(1),
  source: z
    .enum(["pix", "cartao", "dinheiro", "delivery", "marketplace", "manual", "transferencia"])
    .optional()
    .default("manual"),
});
