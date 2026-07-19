import * as z from "zod";

// .nullable() além de .optional(): FormData.get() retorna `null` para um
// campo ausente do DOM (mesmo bug já corrigido em uuidOpcional(), Sprint
// 05/07).
function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

function dataOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const leadSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do lead." }),
  telefone: campoOpcional(),
  email: campoOpcional(),
  origem: campoOpcional(),
  etapaId: z.string().uuid({ error: "Selecione uma etapa." }),
  valorEstimado: z.coerce.number().min(0).default(0),
  probabilidade: z.coerce.number().min(0).max(100).default(0),
  proximaAcao: campoOpcional(),
  proximaAcaoEm: dataOpcional(),
  observacoes: campoOpcional(),
});

export const etapaSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome da etapa." }),
  cor: z.string().trim().min(1).default("#64748b"),
  ordem: z.coerce.number().int().default(0),
});
