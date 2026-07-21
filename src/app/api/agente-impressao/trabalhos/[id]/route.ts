import { type NextRequest, NextResponse } from "next/server";
import * as z from "zod";

import { autenticarAgente } from "@/features/etiquetas/agente-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const atualizarStatusSchema = z.object({
  status: z.enum(["processando", "concluido", "erro"]),
  erroMensagem: z.string().trim().optional(),
});

const TRANSICOES_PERMITIDAS: Record<string, string[]> = {
  pendente: ["processando", "erro"],
  processando: ["concluido", "erro"],
};

/** O agente local reporta a transição de status de um trabalho (pendente -> processando -> concluído/erro). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const agente = await autenticarAgente(request);
  if (!agente) {
    return NextResponse.json({ erro: "Chave de API inválida ou agente inativo." }, { status: 401 });
  }

  const { id } = await params;
  const corpo = await request.json().catch(() => null);
  const validado = atualizarStatusSchema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: trabalho } = await supabase
    .from("fila_impressao")
    .select("id, empresa_id, tentativas, status")
    .eq("id", id)
    .maybeSingle();

  if (!trabalho || trabalho.empresa_id !== agente.empresaId) {
    return NextResponse.json({ erro: "Trabalho não encontrado." }, { status: 404 });
  }

  const permitidos = TRANSICOES_PERMITIDAS[trabalho.status] ?? [];
  if (!permitidos.includes(validado.data.status)) {
    return NextResponse.json(
      {
        erro: `Transição ${trabalho.status} → ${validado.data.status} não permitida.`,
      },
      { status: 409 },
    );
  }

  const finalizado = validado.data.status === "concluido" || validado.data.status === "erro";

  const { data: atualizado, error } = await supabase
    .from("fila_impressao")
    .update({
      status: validado.data.status,
      erro_mensagem: validado.data.erroMensagem ?? null,
      tentativas: trabalho.tentativas + 1,
      processado_em: finalizado ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("status", trabalho.status)
    .select("id")
    .maybeSingle();

  if (error || !atualizado) {
    return NextResponse.json(
      { erro: "Não foi possível atualizar o trabalho (estado concorrente)." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
