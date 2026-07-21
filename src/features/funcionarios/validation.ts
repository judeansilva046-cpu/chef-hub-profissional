import * as z from "zod";

import { TIPOS_CONTRATO } from "./types";

const tiposContratoValues = TIPOS_CONTRATO.map((opcao) => opcao.value) as [
  (typeof TIPOS_CONTRATO)[number]["value"],
  ...(typeof TIPOS_CONTRATO)[number]["value"][],
];

export const funcionarioSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do funcionário." }),
  cargo: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  tipoContrato: z.enum(tiposContratoValues, {
    error: "Selecione o tipo de contrato.",
  }),
  salarioBruto: z.coerce
    .number({ error: "Informe um salário válido." })
    .min(0, { error: "O salário não pode ser negativo." }),
  cargaHorariaSemanal: z.coerce
    .number({ error: "Informe a carga horária." })
    .positive({ error: "A carga horária deve ser maior que zero." }),
  beneficiosMensais: z.coerce
    .number({ error: "Informe um valor válido." })
    .min(0, { error: "Os benefícios não podem ser negativos." }),
  percentualEncargos: z.coerce
    .number({ error: "Informe um percentual válido." })
    .min(0, { error: "O percentual não pode ser negativo." }),
  observacoes: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export type FuncionarioInput = z.infer<typeof funcionarioSchema>;
