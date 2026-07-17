import { type NextRequest, NextResponse } from "next/server";

import { autenticarAgente } from "@/features/etiquetas/agente-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * API consultada pelo agente local (Windows) — GET busca os trabalhos
 * pendentes da empresa do agente autenticado; PATCH em
 * /trabalhos/[id] reporta o resultado. Contrato completo documentado em
 * docs/AGENTE-LOCAL.md. Não requer sessão Supabase Auth — autenticação via
 * Bearer da chave do agente (ver src/features/etiquetas/agente-auth.ts).
 */
export async function GET(request: NextRequest) {
  const agente = await autenticarAgente(request);
  if (!agente) {
    return NextResponse.json({ erro: "Chave de API inválida ou agente inativo." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("fila_impressao")
    .select("id, tipo, payload, status, tentativas, criado_em")
    .eq("empresa_id", agente.empresaId)
    .eq("status", "pendente")
    .order("criado_em", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ erro: "Não foi possível consultar a fila." }, { status: 500 });
  }

  return NextResponse.json({ trabalhos: data ?? [] });
}
