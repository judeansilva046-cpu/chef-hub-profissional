import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type MembroEmpresaComPerfil = Tables<"membros_empresa"> & {
  profiles: Pick<Tables<"profiles">, "id" | "nome_completo" | "email"> | null;
};

export async function listarMembrosEmpresa(): Promise<MembroEmpresaComPerfil[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membros_empresa")
    .select(
      "*, profiles!membros_empresa_usuario_id_fkey ( id, nome_completo, email )",
    )
    .eq("empresa_id", empresa.id)
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return data as MembroEmpresaComPerfil[];
}
