import * as z from "zod";

import { TIPOS_GRANDEZA } from "./types";

const tiposGrandezaValues = TIPOS_GRANDEZA.map((tipo) => tipo.value) as [
  string,
  ...string[],
];

export const unidadeMedidaSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome da unidade." }),
  sigla: z
    .string()
    .trim()
    .min(1, { error: "Informe a sigla." })
    .max(10, { error: "Sigla muito longa (máx. 10 caracteres)." }),
  tipoGrandeza: z.enum(tiposGrandezaValues, {
    error: "Selecione o tipo de grandeza.",
  }),
});

export type UnidadeMedidaInput = z.infer<typeof unidadeMedidaSchema>;
