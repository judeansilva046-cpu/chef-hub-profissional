import * as z from "zod";

// .nullable() além de .optional(): FormData.get() retorna `null` para um
// campo ausente do DOM (mesmo bug já corrigido em uuidOpcional(), Sprint
// 05/07) — mantido aqui por consistência mesmo nos campos hoje sempre
// renderizados, para não repetir o bug se o formulário mudar depois.
function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

function numeroOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : undefined));
}

export const segmentoPersonalizadoSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do segmento." }),
  descricao: campoOpcional(),
  gastoMinimo: numeroOpcional(),
  gastoMaximo: numeroOpcional(),
  ticketMedioMinimo: numeroOpcional(),
  frequenciaMinima: numeroOpcional(),
  diasSemComprarMinimo: numeroOpcional(),
  tags: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) =>
      value ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
    ),
  origem: campoOpcional(),
});

export type SegmentoPersonalizadoInput = z.infer<typeof segmentoPersonalizadoSchema>;
