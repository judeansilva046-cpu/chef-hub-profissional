import * as z from "zod";

export const PAPEIS_EMPRESA = [
  "owner",
  "gerente",
  "financeiro",
  "caixa",
  "cozinha",
  "garcom",
] as const;

export const PAPEL_EMPRESA_LABEL: Record<(typeof PAPEIS_EMPRESA)[number], string> =
  {
    owner: "Owner",
    gerente: "Gerente",
    financeiro: "Financeiro",
    caixa: "Caixa",
    cozinha: "Cozinha",
    garcom: "Garçom",
  };

export const convidarMembroSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ error: "Informe um e-mail válido." }),
  papel: z.enum(PAPEIS_EMPRESA, {
    error: "Selecione um papel.",
  }),
});

export const alterarPapelSchema = z.object({
  membroId: z.string().uuid({ error: "Membro inválido." }),
  papel: z.enum(PAPEIS_EMPRESA, {
    error: "Selecione um papel.",
  }),
});

export type ConvidarMembroInput = z.infer<typeof convidarMembroSchema>;
