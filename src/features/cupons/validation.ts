import * as z from "zod";

function uuidOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .nullable()
    .transform((value) => (value ? value : null));
}

function dataOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const cupomSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, { error: "Informe o código do cupom." })
    .transform((value) => value.toUpperCase()),
  descricao: campoOpcional(),
  tipo: z.enum(["percentual", "fixo", "frete_gratis", "produto_gratis"]),
  valor: z.coerce.number().min(0).default(0),
  fichaTecnicaGratisId: uuidOpcional(),
  compraMinima: z.coerce.number().min(0).default(0),
  limiteUsoTotal: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null)),
  limiteUsoPorCliente: z.coerce.number().int().positive().default(1),
  canalVendaId: uuidOpcional(),
  segmento: campoOpcional(),
  validoDe: dataOpcional(),
  validoAte: dataOpcional(),
});

export type CupomInput = z.infer<typeof cupomSchema>;

export const aplicarCupomSchema = z.object({
  codigo: z.string().trim().min(1, { error: "Informe o código do cupom." }),
  clienteId: z.string().uuid({ error: "Cliente inválido." }),
  valorCompra: z.coerce.number().positive({ error: "Informe o valor da compra." }),
  canalVendaId: z.string().uuid().optional(),
});
