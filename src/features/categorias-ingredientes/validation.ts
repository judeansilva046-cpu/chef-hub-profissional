import * as z from "zod";

export const categoriaIngredienteSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome da categoria." }),
  descricao: z
    .string()
    .trim()
    .max(280, { error: "Descrição muito longa (máx. 280 caracteres)." })
    .optional()
    .or(z.literal("")),
});

export type CategoriaIngredienteInput = z.infer<
  typeof categoriaIngredienteSchema
>;
