import * as z from "zod";

export const TAMANHO_ETIQUETA_OPCOES = [
  { value: "50x30", label: "50 × 30 mm" },
  { value: "60x40", label: "60 × 40 mm" },
] as const;

export const emitirEtiquetaSchema = z.object({
  loteId: z.uuid({ error: "Selecione o lote." }),
  tamanho: z.enum(["50x30", "60x40"], { error: "Selecione o tamanho da etiqueta." }),
  quantidadeEtiquetas: z.coerce
    .number({ error: "Informe a quantidade de etiquetas." })
    .int({ error: "A quantidade deve ser um número inteiro." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
});

export type EmitirEtiquetaInput = z.infer<typeof emitirEtiquetaSchema>;

export const agenteImpressaoSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe um nome para identificar o agente." }),
});

export type AgenteImpressaoInput = z.infer<typeof agenteImpressaoSchema>;
