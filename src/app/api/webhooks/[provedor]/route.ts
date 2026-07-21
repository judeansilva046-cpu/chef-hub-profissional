import { type NextRequest, NextResponse } from "next/server";

import { obterAdapter } from "@/integrations/registry";
import { PROVEDORES_INTEGRACAO, type ProvedorIntegracao } from "@/integrations/types";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const MAX_PAYLOAD_BYTES = 64 * 1024;

/**
 * Inbox de webhooks. Em produção só aceita payloads com assinatura válida
 * (adapters reais). Em desenvolvimento, `INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED=true`
 * permite gravar com assinatura_valida=false para testes locais.
 *
 * Sempre limita tamanho do corpo e nunca processa o pedido — só registra.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provedor: string }> },
) {
  const { provedor } = await params;

  if (!PROVEDORES_INTEGRACAO.some((item) => item.value === provedor)) {
    return NextResponse.json({ erro: "Provedor desconhecido." }, { status: 404 });
  }

  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ erro: "Payload muito grande." }, { status: 413 });
  }

  let payload: Json;
  try {
    payload = raw ? (JSON.parse(raw) as Json) : null;
  } catch {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const adapter = obterAdapter(provedor as ProvedorIntegracao);
  const assinaturaValida = adapter.validarAssinaturaWebhook(payload, request.headers);
  const permitirSemAssinatura = process.env.INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED === "true";

  if (!assinaturaValida && !permitirSemAssinatura) {
    return NextResponse.json(
      { erro: "Assinatura de webhook inválida ou não configurada." },
      { status: 401 },
    );
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("integracoes_webhooks_recebidos").insert({
    provedor,
    payload,
    assinatura_valida: assinaturaValida,
    processado: false,
    erro_mensagem: assinaturaValida
      ? null
      : "Recebido sem assinatura válida (modo desenvolvimento).",
  });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível registrar o webhook." }, { status: 500 });
  }

  return NextResponse.json({ recebido: true, assinatura_valida: assinaturaValida });
}
