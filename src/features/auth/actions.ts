"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/server/observabilidade/auditoria";
import { registrarLog } from "@/server/observabilidade/logs";

import { loginSchema, signupSchema } from "./validation";

export interface AuthActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function login(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    void registrarLog({
      nivel: "WARNING",
      modulo: "auth",
      mensagem: "Falha de login",
      detalhes: { email: validated.data.email },
      empresaId: null,
    });
    return { formError: "E-mail ou senha inválidos." };
  }

  await registrarAuditoria({
    acao: "login",
    entidade: "auth",
    empresaId: null,
    metadados: { email: validated.data.email },
  });

  redirect("/fichas-tecnicas");
}

export async function signup(
  _prevState: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const validated = signupSchema.safeParse({
    nomeCompleto: formData.get("nomeCompleto"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: { nome_completo: validated.data.nomeCompleto },
    },
  });

  if (error) {
    void registrarLog({
      nivel: "ERROR",
      modulo: "auth",
      mensagem: "Falha no cadastro",
      detalhes: { email: validated.data.email },
      empresaId: null,
    });
    return { formError: "Não foi possível criar a conta. Tente novamente." };
  }

  if (data.session) {
    await registrarAuditoria({
      acao: "signup",
      entidade: "auth",
      empresaId: null,
      metadados: { email: validated.data.email },
    });
  }

  if (!data.session) {
    // Confirmação de e-mail habilitada no projeto Supabase: não há sessão
    // imediata. O link do e-mail leva a /auth/confirm, que finaliza o login.
    return {
      formError:
        "Conta criada! Verifique seu e-mail para confirmar antes de entrar.",
    };
  }

  redirect("/fichas-tecnicas");
}

export async function logout() {
  await registrarAuditoria({
    acao: "logout",
    entidade: "auth",
  });
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
