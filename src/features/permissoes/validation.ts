import { z } from "zod";

export const PAPEIS_CONVITE = ["financeiro", "operacional", "leitura"] as const;

export const convidarUsuarioSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail.").email("E-mail inválido."),
  papel: z.enum(PAPEIS_CONVITE, { message: "Selecione um papel." }),
});

export const atualizarPapelSchema = z.object({
  papel: z.enum(PAPEIS_CONVITE, { message: "Selecione um papel." }),
});
