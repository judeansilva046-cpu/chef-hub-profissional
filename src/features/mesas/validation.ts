import * as z from "zod";

export const mesaSchema = z.object({
  identificador: z.string().trim().min(1, { error: "Informe o identificador da mesa." }),
  capacidade: z.coerce.number().int().positive().optional().nullable(),
});
