import * as z from "zod";

export const fichaTecnicaItemSchema = z.object({
  ingredienteId: z.string().min(1, { error: "Selecione um ingrediente." }),
  pesoBruto: z
    .number({ error: "Informe o peso bruto." })
    .positive({ error: "O peso bruto deve ser maior que zero." }),
  percentualPerda: z
    .number()
    .min(0, { error: "A perda não pode ser negativa." })
    .max(99.99, { error: "A perda deve ser menor que 100%." }),
  ordem: z.number().int().min(0),
});

export const fichaTecnicaSchema = z.object({
  fichaId: z.string().nullable(),
  nome: z.string().trim().min(1, { error: "Informe o nome da ficha técnica." }),
  modoPreparo: z.string().trim().nullable(),
  tempoPreparoMinutos: z
    .number()
    .int()
    .min(0, { error: "O tempo de preparo não pode ser negativo." })
    .nullable(),
  rendimentoQuantidade: z
    .number({ error: "Informe o rendimento." })
    .positive({ error: "O rendimento deve ser maior que zero." }),
  rendimentoUnidadeId: z
    .string()
    .min(1, { error: "Selecione a unidade de rendimento." }),
  precoVendaPraticado: z
    .number()
    .min(0, { error: "O preço não pode ser negativo." })
    .nullable(),
  margemContribuicaoPercentualAlvo: z
    .number()
    .min(0, { error: "A margem não pode ser negativa." })
    .max(99.99, { error: "A margem deve ser menor que 100%." })
    .nullable(),
  itens: z
    .array(fichaTecnicaItemSchema)
    .min(1, { error: "Adicione ao menos um ingrediente." }),
});

export type FichaTecnicaInput = z.infer<typeof fichaTecnicaSchema>;
