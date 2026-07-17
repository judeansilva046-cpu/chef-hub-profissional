import * as z from "zod";

export const ingredienteSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do ingrediente." }),
  categoriaId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  unidadeMedidaId: z
    .string()
    .trim()
    .min(1, { error: "Selecione a unidade de medida." }),
  custoUnitarioAtual: z.coerce
    .number({ error: "Informe um custo válido." })
    .min(0, { error: "O custo não pode ser negativo." }),
  estoqueMinimo: z.coerce
    .number({ error: "Informe um estoque mínimo válido." })
    .min(0, { error: "O estoque mínimo não pode ser negativo." }),
});

export type IngredienteInput = z.infer<typeof ingredienteSchema>;
