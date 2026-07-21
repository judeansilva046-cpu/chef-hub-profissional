import { type NextRequest, NextResponse } from "next/server";

import { autenticarAgente } from "@/features/etiquetas/agente-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * API consultada pelo agente local (Windows) — GET busca e "claima"
 * trabalhos pendentes (passa para processando) da empresa do agente.
 * Contrato em docs/AGENTE-LOCAL.md.
 */
export async function GET(request: NextRequest) {
  const agente = await autenticarAgente(request);
  if (!agente) {
    return NextResponse.json({ erro: "Chave de API inválida ou agente inativo." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: pendentes, error } = await supabase
    .from("fila_impressao")
    .select("id, tipo, payload, status, tentativas, criado_em")
    .eq("empresa_id", agente.empresaId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ erro: "Não foi possível consultar a fila." }, { status: 500 });
  }

  const candidatos = pendentes ?? [];
  if (candidatos.length === 0) {
    return NextResponse.json({ trabalhos: [] });
  }

  const ids = candidatos.map((item) => item.id);
  const { data: claimados, error: erroClaim } = await supabase
    .from("fila_impressao")
    .update({ status: "processando" })
    .in("id", ids)
    .eq("empresa_id", agente.empresaId)
    .eq("status", "pendente")
    .select("id, tipo, payload, status, tentativas, criado_em");

  if (erroClaim) {
    return NextResponse.json({ erro: "Não foi possível reservar os trabalhos." }, { status: 500 });
  }

  return NextResponse.json({ trabalhos: claimados ?? [] });
}
