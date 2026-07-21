import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

import { verifySession } from "./dal";
import type { PapelEmpresa } from "./permissoes-rota";

export const EMPRESA_ATIVA_COOKIE = "empresa_ativa_id";

export type { PapelEmpresa };

/**
 * Todas as empresas do usuário logado (dono **ou** membro ativo — RLS em
 * `empresas` usa `fn_empresas_acessiveis()`). Ordenadas por criação para que a
 * primeira empresa criada seja o fallback previsível quando não há cookie.
 */
export const getEmpresasDoUsuario = cache(
  async (): Promise<Tables<"empresas">[]> => {
    await verifySession();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data;
  },
);

/**
 * Resolve a "empresa ativa" da requisição atual: lê o cookie
 * empresa_ativa_id, valida que pertence ao usuário logado (RLS já garante
 * isso na query, mas conferimos explicitamente para não silenciosamente
 * cair em outra empresa) e cai para a primeira empresa do usuário quando o
 * cookie está ausente ou aponta para uma empresa que não é mais válida.
 * Retorna null quando o usuário ainda não tem nenhuma empresa (precisa
 * passar pelo onboarding).
 */
export const getEmpresaAtual = cache(
  async (): Promise<Tables<"empresas"> | null> => {
    const empresas = await getEmpresasDoUsuario();

    if (empresas.length === 0) {
      return null;
    }

    const cookieStore = await cookies();
    const empresaAtivaId = cookieStore.get(EMPRESA_ATIVA_COOKIE)?.value;

    const empresaValida = empresas.find(
      (empresa) => empresa.id === empresaAtivaId,
    );

    return empresaValida ?? empresas[0];
  },
);

/**
 * Papel do usuário autenticado na empresa ativa (`fn_papel_na_empresa`).
 * Owner primário (`empresas.usuario_id`) sempre resolve como `'owner'`.
 */
export const getPapelNaEmpresaAtual = cache(
  async (): Promise<PapelEmpresa | null> => {
    const empresa = await getEmpresaAtual();
    if (!empresa) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("fn_papel_na_empresa", {
      p_empresa_id: empresa.id,
    });

    if (error) {
      throw error;
    }

    if (
      data === "owner" ||
      data === "gerente" ||
      data === "caixa" ||
      data === "cozinha" ||
      data === "garcom"
    ) {
      return data;
    }

    return null;
  },
);
