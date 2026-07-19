import * as z from "zod";

// .nullable() é necessário além de .optional(): FormData.get() retorna
// `null` (não `undefined`) para um campo ausente do formulário — caso dos
// inputs hidden condicionais (referenciaTipo/referenciaId, só renderizados
// quando a tarefa é criada a partir do perfil de um cliente/lead). Mesmo bug
// já corrigido em uuidOpcional() (Sprint 05, src/features/pedidos/
// validation.ts) — .optional() sozinho rejeita `null`.
function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const tarefaSchema = z.object({
  titulo: z.string().trim().min(1, { error: "Informe o título da tarefa." }),
  descricao: campoOpcional(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
  prazo: campoOpcional(),
  lembreteEm: campoOpcional(),
  referenciaTipo: z
    .enum(["cliente", "lead"])
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
  referenciaId: campoOpcional(),
});
