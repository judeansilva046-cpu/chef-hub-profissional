import * as z from "zod";

export const producaoSchema = z.object({
  fichaTecnicaId: z
    .string()
    .trim()
    .min(1, { error: "Selecione a ficha técnica." }),
  dataProducao: z
    .string()
    .trim()
    .min(1, { error: "Informe a data de produção." }),
  quantidadePlanejada: z.coerce
    .number({ error: "Informe a quantidade." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  observacao: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type ProducaoInput = z.infer<typeof producaoSchema>;
