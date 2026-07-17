import * as z from "zod";

function uuidOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const vendaSchema = z.object({
  fichaTecnicaId: z.uuid({ error: "Selecione a ficha técnica vendida." }),
  canalVendaId: uuidOpcional(),
  clienteId: uuidOpcional(),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  precoUnitarioPraticado: z.coerce
    .number({ error: "Informe um preço válido." })
    .min(0, { error: "O preço não pode ser negativo." }),
  dataVenda: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Selecione a data da venda." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type VendaInput = z.infer<typeof vendaSchema>;
