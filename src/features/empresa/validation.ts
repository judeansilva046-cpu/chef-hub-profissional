import * as z from "zod";

import { TIPOS_NEGOCIO } from "./types";

const tiposNegocioValues = TIPOS_NEGOCIO.map((tipo) => tipo.value) as [
  string,
  ...string[],
];

export const empresaSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome da empresa." }),
  tipoNegocio: z.enum(tiposNegocioValues, {
    error: "Selecione o tipo de negócio.",
  }),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
