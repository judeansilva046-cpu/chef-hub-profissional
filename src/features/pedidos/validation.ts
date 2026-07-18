import * as z from "zod";

// .nullable() além de .optional(): caixaId chega como `null` explícito do
// PDV/Pedido (caixaAberto?.id ?? null) quando não há caixa aberto — sem
// isso, o schema rejeitava esse `null` com o erro genérico "Invalid input"
// do Zod, e o pagamento nunca era registrado (achado pelo teste E2E do PDV).
function uuidOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const TIPOS_PEDIDO = [
  "balcao",
  "retirada",
  "entrega",
  "consumo_local",
  "mesa",
] as const;

export const FORMAS_PAGAMENTO = [
  "dinheiro",
  "pix",
  "debito",
  "credito",
  "vale",
  "pagamento_entrega",
] as const;

export const novoPedidoSchema = z.object({
  tipo: z.enum(TIPOS_PEDIDO, { error: "Selecione o tipo do pedido." }),
  clienteId: uuidOpcional(),
  canalVendaId: uuidOpcional(),
  comandaId: uuidOpcional(),
  observacoes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
export type NovoPedidoInput = z.infer<typeof novoPedidoSchema>;

export const itemPedidoSchema = z.object({
  fichaTecnicaId: z.uuid({ error: "Selecione o item." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  precoUnitarioPraticado: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
  descontoValor: z.coerce.number().min(0).default(0),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
export type ItemPedidoInput = z.infer<typeof itemPedidoSchema>;

export const adicionalItemSchema = z.object({
  fichaTecnicaId: z.uuid({ error: "Selecione o adicional." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  precoUnitarioPraticado: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
});
export type AdicionalItemInput = z.infer<typeof adicionalItemSchema>;

export const valoresPedidoSchema = z.object({
  descontoPercentual: z.coerce.number().min(0).max(100).default(0),
  descontoValorFixo: z.coerce.number().min(0).default(0),
  acrescimoValor: z.coerce.number().min(0).default(0),
  taxaEntrega: z.coerce.number().min(0).default(0),
});
export type ValoresPedidoInput = z.infer<typeof valoresPedidoSchema>;

export const cancelamentoPedidoSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(3, { error: "Informe o motivo do cancelamento." }),
});

export const pagamentoPedidoSchema = z.object({
  formaPagamento: z.enum(FORMAS_PAGAMENTO, { error: "Selecione a forma de pagamento." }),
  valor: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive({ error: "O valor deve ser maior que zero." }),
  trocoPara: z.coerce.number().min(0).optional().nullable(),
  caixaId: uuidOpcional(),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});
export type PagamentoPedidoInput = z.infer<typeof pagamentoPedidoSchema>;
