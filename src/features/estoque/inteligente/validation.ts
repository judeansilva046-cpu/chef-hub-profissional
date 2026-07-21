import { z } from "zod";

export const perdaSchema = z.object({
  ingredienteId: z.string().uuid("Ingrediente inválido."),
  quantity: z.coerce.number().positive("Informe a quantidade perdida."),
  reason: z.enum(["quebra", "vencimento", "desperdicio", "producao", "outro"]),
  notes: z.string().max(500).optional().nullable(),
  lostAt: z.string().optional().nullable(),
  estoqueLoteId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
});

export const inventarioInteligenteSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  tipo: z.enum(["parcial", "geral", "setor"]),
  setor: z.string().trim().max(80).optional().nullable(),
  ingredienteIds: z.array(z.string().uuid()).optional(),
});

export const perguntaIaSchema = z.object({
  pergunta: z.string().trim().min(3, "Faça uma pergunta.").max(500),
});

export const horizonteSchema = z.object({
  horizonteDias: z.coerce.number().int().min(1).max(90).default(7),
  diasHistorico: z.coerce.number().int().min(7).max(180).default(30),
});
