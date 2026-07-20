import { type NextRequest, NextResponse } from "next/server";

import { obterAdapter } from "@/integrations/registry";
import { PROVEDORES_INTEGRACAO, type ProvedorIntegracao } from "@/integrations/types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Campos onde diferentes provedores costumam colocar o ID do
 * estabelecimento no corpo do webhook — nenhum payload real de nenhum
 * provedor existe ainda (sem credencial homologada), então isto é uma
 * tentativa best-effort com os nomes mais comuns do mercado (merchant/store
 * id), não um contrato validado contra a API real de nenhuma plataforma.
 * Ajustar aqui quando o formato real de cada provedor for conhecido.
 */
const CAMPOS_IDENTIFICADOR_CANDIDATOS = [
  "merchantId",
  "merchant_id",
  "storeId",
  "store_id",
  "lojaId",
  "loja_id",
] as const;

function extrairIdentificadorExterno(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const registro = payload as Record<string, unknown>;
  for (const campo of CAMPOS_IDENTIFICADOR_CANDIDATOS) {
    const valor = registro[campo];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }
  return null;
}

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

  // Tenta descobrir de qual empresa é este webhook casando o identificador
  // do estabelecimento no payload contra integracoes_canais.identificador_
  // externo (gravado quando a empresa conectou a integração). Sem isso a
  // linha ficava com empresa_id nulo — e a única policy da tabela é SELECT
  // por empresa_id, então era estruturalmente invisível para todo mundo.
  const identificadorExterno = extrairIdentificadorExterno(payload);
  let empresaId: string | null = null;
  if (identificadorExterno) {
    const { data } = await supabase.rpc("fn_resolver_empresa_webhook_integracao", {
      p_provedor: provedor,
      p_identificador_externo: identificadorExterno,
    });
    empresaId = data ?? null;
  }

  const { error } = await supabase.from("integracoes_webhooks_recebidos").insert({
    empresa_id: empresaId,
    provedor,
    payload,
    assinatura_valida: assinaturaValida,
    processado: false,
    erro_mensagem: !assinaturaValida
      ? "Assinatura não validada — nenhum adapter tem segredo de webhook real configurado nesta sprint."
      : empresaId === null
        ? "Não foi possível identificar a empresa a partir do payload (identificador do estabelecimento ausente ou não conectado)."
        : null,
  });

  if (error) {
    return NextResponse.json({ erro: "Não foi possível registrar o webhook." }, { status: 500 });
  }

  // 200 para o provedor não ficar retentando indefinidamente — o registro
  // fica com processado=false para revisão manual/futura implementação.
  return NextResponse.json({ recebido: true });
}
