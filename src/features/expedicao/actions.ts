"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";
import { requireEmpresaAtual } from "@/server/auth/require-empresa";

import { entregadorSchema } from "./validation";

function revalidarExpedicao() {
  revalidatePath("/expedicao");
  revalidatePath("/pedidos");
}

export async function criarEntregador(input: unknown): Promise<void> {
  const empresa = await getEmpresaAtual();
  if (!empresa) throw new Error("Nenhuma empresa ativa.");

  const validated = entregadorSchema.safeParse(input);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("entregadores").insert({
    empresa_id: empresa.id,
    nome: validated.data.nome,
    telefone: validated.data.telefone,
    veiculo: validated.data.veiculo,
  });

  if (error) throw new Error("Não foi possível cadastrar o entregador.");
  revalidarExpedicao();
}

const PROXIMOS_STATUS_EXPEDICAO: Record<string, string> = {
  aguardando: "conferido",
  conferido: "embalado",
  embalado: "saiu",
  saiu: "entregue",
};

/**
 * Avança a expedição — sem RPC: efeitos colaterais em pedidos (sincronizar
 * status, criar venda ao entregar) são cobertos pela trigger
 * expedicoes_after_update_sincronizar (0038), então um UPDATE direto aqui
 * já dispara tudo o que precisa, sem duplicar a orquestração no app.
 */
export async function avancarStatusExpedicao(
  expedicaoId: string,
  statusAtual: string,
  opts?: { entregadorId?: string | null },
): Promise<void> {
  const empresa = await requireEmpresaAtual();
  const proximoStatus = PROXIMOS_STATUS_EXPEDICAO[statusAtual];
  if (!proximoStatus) {
    throw new Error("Não há próxima etapa para este status.");
  }

  const supabase = await createClient();

  const { data: atual, error: erroAtual } = await supabase
    .from("expedicoes")
    .select("id, status, pedidos!inner(tipo)")
    .eq("id", expedicaoId)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (erroAtual || !atual) throw new Error("Expedição não encontrada.");

  const tipoPedido = (atual.pedidos as { tipo: string }).tipo;
  if (proximoStatus === "saiu" && tipoPedido === "entrega" && !opts?.entregadorId) {
    throw new Error("Selecione um entregador antes de registrar a saída.");
  }

  const { data, error } = await supabase
    .from("expedicoes")
    .update({
      status: proximoStatus,
      horario_saida: proximoStatus === "saiu" ? new Date().toISOString() : undefined,
      entregador_id: proximoStatus === "saiu" ? (opts?.entregadorId ?? undefined) : undefined,
      horario_entrega: proximoStatus === "entregue" ? new Date().toISOString() : undefined,
    })
    .eq("id", expedicaoId)
    .eq("empresa_id", empresa.id)
    .eq("status", statusAtual)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Status da expedição mudou — atualize a tela e tente de novo.");
  }
  revalidarExpedicao();
}
