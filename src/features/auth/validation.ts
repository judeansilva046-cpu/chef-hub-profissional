import * as z from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export const signupSchema = z
  .object({
    nomeCompleto: z
      .string()
      .trim()
      .min(2, { error: "Informe seu nome completo." }),
    email: z.email({ error: "Informe um e-mail válido." }),
    password: z
      .string()
      .min(8, { error: "A senha precisa ter ao menos 8 caracteres." })
      .regex(/[a-zA-Z]/, {
        error: "A senha precisa conter ao menos uma letra.",
      })
      .regex(/[0-9]/, { error: "A senha precisa conter ao menos um número." }),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.password === data.confirmarSenha, {
    error: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
