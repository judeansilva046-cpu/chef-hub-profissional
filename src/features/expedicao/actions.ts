"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

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
  const proximoStatus = PROXIMOS_STATUS_EXPEDICAO[statusAtual];
  if (!proximoStatus) {
    throw new Error("Não há próxima etapa para este status.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("expedicoes")
    .update({
      status: proximoStatus,
      horario_saida: proximoStatus === "saiu" ? new Date().toISOString() : undefined,
      entregador_id: proximoStatus === "saiu" ? (opts?.entregadorId ?? undefined) : undefined,
      horario_entrega: proximoStatus === "entregue" ? new Date().toISOString() : undefined,
    })
    .eq("id", expedicaoId)
    .eq("status", statusAtual);

  if (error) throw new Error("Não foi possível avançar a expedição.");
  revalidarExpedicao();
}
