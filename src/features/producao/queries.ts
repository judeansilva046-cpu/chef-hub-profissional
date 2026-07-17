import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

export type ProducaoComFicha = Tables<"producoes_planejadas"> & {
  fichas_tecnicas: Pick<Tables<"fichas_tecnicas">, "id" | "nome"> & {
    unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
  };
};

export interface ListarProducoesParams {
  dataInicio: string;
  dataFim: string;
}

export async function listarProducoesPlanejadas({
  dataInicio,
  dataFim,
}: ListarProducoesParams): Promise<ProducaoComFicha[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producoes_planejadas")
    .select("*, fichas_tecnicas(id, nome, unidades_medida(sigla))")
    .eq("empresa_id", empresa.id)
    .gte("data_producao", dataInicio)
    .lte("data_producao", dataFim)
    .order("data_producao", { ascending: true })
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ProducaoComFicha[];
}

export interface ConsumoPrevistoItem {
  ingredienteId: string;
  ingredienteNome: string;
  unidadeSigla: string;
  consumoPrevisto: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  necessidadeCompra: number;
}

/**
 * Mesma fórmula usada por fn_gerar_lista_compras (migration 0019):
 * necessidade = max(0, consumo_previsto + estoque_minimo - estoque_atual).
 * Aqui é só leitura/preview — a geração real da lista de compras acontece
 * no módulo Lista Inteligente de Compras.
 */
export async function calcularConsumoPrevisto({
  dataInicio,
  dataFim,
}: ListarProducoesParams): Promise<ConsumoPrevistoItem[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data: producoes, error: producoesError } = await supabase
    .from("producoes_planejadas")
    .select(
      "quantidade_planejada, fichas_tecnicas(rendimento_quantidade, fichas_tecnicas_itens(ingrediente_id, peso_bruto))",
    )
    .eq("empresa_id", empresa.id)
    .in("status", ["planejada", "em_producao"])
    .gte("data_producao", dataInicio)
    .lte("data_producao", dataFim);

  if (producoesError) throw producoesError;

  const consumoPorIngrediente = new Map<string, number>();

  for (const producao of (producoes ?? []) as unknown as Array<{
    quantidade_planejada: number;
    fichas_tecnicas: {
      rendimento_quantidade: number;
      fichas_tecnicas_itens: { ingrediente_id: string; peso_bruto: number }[];
    };
  }>) {
    const fator =
      producao.quantidade_planejada /
      producao.fichas_tecnicas.rendimento_quantidade;

    for (const item of producao.fichas_tecnicas.fichas_tecnicas_itens) {
      const atual = consumoPorIngrediente.get(item.ingrediente_id) ?? 0;
      consumoPorIngrediente.set(
        item.ingrediente_id,
        atual + item.peso_bruto * fator,
      );
    }
  }

  const ingredienteIds = Array.from(consumoPorIngrediente.keys());
  if (ingredienteIds.length === 0) return [];

  const { data: ingredientes, error: ingredientesError } = await supabase
    .from("ingredientes")
    .select(
      "id, nome, estoque_minimo, unidades_medida(sigla), estoque_saldos(quantidade_total)",
    )
    .in("id", ingredienteIds);

  if (ingredientesError) throw ingredientesError;

  return ((ingredientes ?? []) as unknown as Array<{
    id: string;
    nome: string;
    estoque_minimo: number;
    unidades_medida: { sigla: string };
    estoque_saldos:
      | { quantidade_total: number }[]
      | { quantidade_total: number }
      | null;
  }>)
    .map((ingrediente) => {
      const saldo = Array.isArray(ingrediente.estoque_saldos)
        ? ingrediente.estoque_saldos[0]
        : ingrediente.estoque_saldos;
      const estoqueAtual = saldo?.quantidade_total ?? 0;
      const consumoPrevisto = consumoPorIngrediente.get(ingrediente.id) ?? 0;

      return {
        ingredienteId: ingrediente.id,
        ingredienteNome: ingrediente.nome,
        unidadeSigla: ingrediente.unidades_medida.sigla,
        consumoPrevisto,
        estoqueAtual,
        estoqueMinimo: ingrediente.estoque_minimo,
        necessidadeCompra: Math.max(
          0,
          consumoPrevisto + ingrediente.estoque_minimo - estoqueAtual,
        ),
      };
    })
    .sort((a, b) => a.ingredienteNome.localeCompare(b.ingredienteNome));
}
