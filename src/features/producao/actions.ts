"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import { adicionarDias } from "./date-range";
import { producaoSchema } from "./validation";

export interface ProducaoActionState {
  formError?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
}

export async function criarProducaoPlanejada(
  _prevState: ProducaoActionState | undefined,
  formData: FormData,
): Promise<ProducaoActionState> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    return { formError: "Nenhuma empresa ativa." };
  }

  const validated = producaoSchema.safeParse({
    fichaTecnicaId: formData.get("fichaTecnicaId"),
    dataProducao: formData.get("dataProducao"),
    quantidadePlanejada: formData.get("quantidadePlanejada"),
    observacao: formData.get("observacao"),
  });

  if (!validated.success) {
    return { fieldErrors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("producoes_planejadas").insert({
    empresa_id: empresa.id,
    ficha_tecnica_id: validated.data.fichaTecnicaId,
    data_producao: validated.data.dataProducao,
    quantidade_planejada: validated.data.quantidadePlanejada,
    observacao: validated.data.observacao,
  });

  if (error) {
    return { formError: "Não foi possível criar a produção planejada." };
  }

  revalidatePath("/producao");
  return { success: true };
}

export async function atualizarStatusProducao(
  id: string,
  status: "em_producao" | "cancelada",
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("producoes_planejadas")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error("Não foi possível atualizar a produção.");
  }

  revalidatePath("/producao");
}

/**
 * Conclui a produção via fn_concluir_producao (migration 0018): consome do
 * estoque, por FIFO, os ingredientes da ficha proporcionalmente à
 * quantidade planejada — mesma transação, tudo ou nada.
 */
export async function concluirProducao(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("fn_concluir_producao", {
    p_producao_id: id,
  });

  if (error) {
    throw new Error(
      error.message.includes("Estoque insuficiente")
        ? error.message
        : "Não foi possível concluir a produção.",
    );
  }

  revalidatePath("/producao");
  revalidatePath("/estoque");
  revalidatePath("/estoque/movimentacoes");
  revalidatePath("/estoque/lotes");
}

/**
 * "Planejamento automático": copia todas as produções não canceladas da
 * semana anterior (mesmo intervalo de 7 dias, deslocado) para a semana
 * atual, como novas produções em status 'planejada'. Interpretação
 * deliberadamente simples de "planejamento automático" — repetir o padrão
 * da semana anterior é previsível e auditável, ao contrário de um motor de
 * previsão de demanda não solicitado.
 */
export async function repetirSemanaAnterior(
  dataInicioSemanaAtual: string,
): Promise<number> {
  const empresa = await getEmpresaAtual();
  if (!empresa) {
    throw new Error("Nenhuma empresa ativa.");
  }

  const dataInicioAnterior = adicionarDias(dataInicioSemanaAtual, -7);
  const dataFimAnterior = adicionarDias(dataInicioSemanaAtual, -1);

  const supabase = await createClient();
  const { data: producoesAnteriores, error: buscarError } = await supabase
    .from("producoes_planejadas")
    .select("ficha_tecnica_id, data_producao, quantidade_planejada, observacao")
    .eq("empresa_id", empresa.id)
    .neq("status", "cancelada")
    .gte("data_producao", dataInicioAnterior)
    .lte("data_producao", dataFimAnterior);

  if (buscarError) {
    throw new Error("Não foi possível carregar a semana anterior.");
  }

  if (!producoesAnteriores || producoesAnteriores.length === 0) {
    return 0;
  }

  const novasProducoes = producoesAnteriores.map((producao) => ({
    empresa_id: empresa.id,
    ficha_tecnica_id: producao.ficha_tecnica_id,
    data_producao: adicionarDias(producao.data_producao, 7),
    quantidade_planejada: producao.quantidade_planejada,
    observacao: producao.observacao,
  }));

  const { error: inserirError } = await supabase
    .from("producoes_planejadas")
    .insert(novasProducoes);

  if (inserirError) {
    throw new Error("Não foi possível repetir a semana anterior.");
  }

  revalidatePath("/producao");
  return novasProducoes.length;
}
