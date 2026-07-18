import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { verifySession } from "@/server/auth/dal";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type MembroEmpresa = Tables<"usuarios_empresa"> & {
  profiles: Pick<Tables<"profiles">, "nome_completo" | "email"> | null;
};

export interface PermissoesContexto {
  empresaId: string;
  souDono: boolean;
  membros: MembroEmpresa[];
}

/**
 * Membros da empresa ativa + se o usuário logado é o dono (só o dono
 * gerencia convites/papéis, ver policies usuarios_empresa_insert_dono/
 * usuarios_empresa_update_dono na 0043). `profiles` vem à parte via
 * fn_perfis_visiveis_financeiro porque a policy de profiles só permite
 * ler a própria linha (mesmo motivo documentado em auditoria/queries.ts).
 */
export async function buscarContextoPermissoes(): Promise<PermissoesContexto | null> {
  const { user } = await verifySession();
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();

  const [{ data: membros, error: membrosError }, { data: perfis, error: perfisError }] = await Promise.all([
    supabase
      .from("usuarios_empresa")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("criado_em", { ascending: true }),
    supabase.rpc("fn_perfis_visiveis_financeiro", { p_empresa_id: empresa.id }),
  ]);

  if (membrosError) throw membrosError;
  if (perfisError) throw perfisError;

  const perfisPorId = new Map((perfis ?? []).map((perfil) => [perfil.id, perfil]));

  return {
    empresaId: empresa.id,
    souDono: empresa.usuario_id === user.id,
    membros: (membros ?? []).map((membro) => ({
      ...membro,
      profiles: perfisPorId.has(membro.usuario_id)
        ? {
            nome_completo: perfisPorId.get(membro.usuario_id)!.nome_completo,
            email: perfisPorId.get(membro.usuario_id)!.email,
          }
        : null,
    })),
  };
}
