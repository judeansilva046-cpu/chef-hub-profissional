import * as z from "zod";

// .nullable() além de .optional(): FormData.get() retorna `null` (não
// `undefined`) para um campo ausente do DOM — caso de diasInatividade
// abaixo, só renderizado no formulário quando gatilho='inatividade' (mesmo
// bug já corrigido em uuidOpcional(), Sprint 05/07).
function campoOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? value : null));
}

export const templateSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do template." }),
  canal: z.enum(["whatsapp", "email", "sms", "interno"]),
  assunto: campoOpcional(),
  conteudo: z.string().trim().min(1, { error: "Informe o conteúdo da mensagem." }),
});

export const interacaoSchema = z.object({
  clienteId: z.string().uuid({ error: "Cliente inválido." }),
  canal: z.enum(["whatsapp", "email", "sms", "interno", "ligacao", "presencial"]),
  tipo: z.enum(["mensagem", "nota", "reclamacao"]),
  assunto: campoOpcional(),
  conteudo: campoOpcional(),
});

export const campanhaSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome da campanha." }),
  gatilho: z.enum(["aniversario", "inatividade", "primeira_compra", "manual"]),
  diasInatividade: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : null)),
  cupomId: campoOpcional(),
  templateId: z.string().uuid({ error: "Selecione um template." }),
});
