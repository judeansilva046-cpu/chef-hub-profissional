import { type NextRequest, NextResponse } from "next/server";

import { obterAdapter } from "@/integrations/registry";
import { PROVEDORES_INTEGRACAO, type ProvedorIntegracao } from "@/integrations/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Inbox interno de webhooks — recebe POST de um provedor externo (iFood,
 * 99Food, Keeta, Open Delivery). Roda com o client service-role porque o
 * provedor não tem sessão Supabase Auth nenhuma. Nenhum adapter valida
 * assinatura de verdade ainda (não há segredo de webhook real configurado
 * — ver src/integrations/*\/adapter.ts) — todo webhook é só logado em
 * integracoes_webhooks_recebidos com assinatura_valida=false e
 * processado=false, para existir rastro sem fingir que foi processado.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provedor: string }> },
) {
  const { provedor } = await params;

  if (!PROVEDORES_INTEGRACAO.some((item) => item.value === provedor)) {
    return NextResponse.json({ erro: "Provedor desconhecido." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  if (payload === null) {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const adapter = obterAdapter(provedor as ProvedorIntegracao);
  const assinaturaValida = adapter.validarAssinaturaWebhook(payload, request.headers);

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("integracoes_webhooks_recebidos").insert({
    provedor,
    payload,
    assinatura_valida: assinaturaValida,
    processado: false,
    erro_mensagem: assinaturaValida
      ? null
      : "Assinatura não validada — nenhum adapter tem segredo de webhook real configurado nesta sprint.",
  });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível registrar o webhook." }, { status: 500 });
  }

  // 200 para o provedor não ficar retentando indefinidamente — o registro
  // fica com processado=false para revisão manual/futura implementação.
  return NextResponse.json({ recebido: true });
}
