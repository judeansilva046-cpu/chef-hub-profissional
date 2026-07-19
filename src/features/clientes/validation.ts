import * as z from "zod";

export const SEGMENTO_CLIENTE_SUGESTOES = [
  "Novo",
  "Recorrente",
  "VIP",
  "Inativo",
] as const;

// .nullable() além de .optional(): FormData.get() retorna `null` para um
// campo ausente do DOM (mesmo bug já corrigido em uuidOpcional(), Sprint
// 05/07) — mantido por consistência mesmo nos campos hoje sempre
// renderizados no formulário.
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

/** "vip, delivery, corporativo" -> ["vip", "delivery", "corporativo"] — mesma convenção de campo livre separado por vírgula já usada em segmento (datalist), sem exigir um seletor de tags dedicado. */
function tagsOpcional() {
  return z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) =>
      value
        ? Array.from(new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean)))
        : [],
    );
}

function checkboxComoBooleano() {
  return z
    .union([z.literal("on"), z.literal(""), z.undefined()])
    .transform((value) => value === "on");
}

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, { error: "Informe o nome do cliente." }),
  telefone: campoOpcional(),
  whatsapp: campoOpcional(),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.email().safeParse(value).success, {
      error: "Informe um e-mail válido.",
    })
    .transform((value) => (value ? value : null)),
  documento: campoOpcional(),
  endereco: campoOpcional(),
  segmento: campoOpcional(),
  dataNascimento: dataOpcional(),
  origem: campoOpcional(),
  tags: tagsOpcional(),
  restricoesAlimentares: campoOpcional(),
  preferencias: campoOpcional(),
  observacoes: campoOpcional(),
  optInWhatsapp: checkboxComoBooleano(),
  optInEmail: checkboxComoBooleano(),
  optInSms: checkboxComoBooleano(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export const ORIGEM_CLIENTE_SUGESTOES = [
  "Indicação",
  "Instagram",
  "iFood",
  "Google",
  "Passou na loja",
] as const;
