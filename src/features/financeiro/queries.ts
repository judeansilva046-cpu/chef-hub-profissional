import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import type { CustoVariavelAgregado } from "./calculations";

export async function listarCustosFixos(): Promise<Tables<"custos_fixos">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custos_fixos")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listarCustosVariaveis(): Promise<
  Tables<"custos_variaveis">[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custos_variaveis")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listarMetasVendas(): Promise<Tables<"metas_vendas">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metas_vendas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("mes_referencia", { ascending: false });

  if (error) throw error;
  return data;
}

export async function buscarMetaVendasDoMes(
  mesReferencia: string,
): Promise<Tables<"metas_vendas"> | null> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metas_vendas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .eq("mes_referencia", mesReferencia)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Soma dos custos fixos ativos — o denominador de todo o módulo (Ponto de Equilíbrio, Painel, Precificação). */
export async function calcularCustosFixosTotais(): Promise<number> {
  const custos = await listarCustosFixos();
  return custos
    .filter((custo) => custo.ativo)
    .reduce((total, custo) => total + custo.valor_mensal, 0);
}

/** Agrega os custos variáveis ativos em percentual total + fixo total por venda — pronto para as fórmulas de calculations.ts. */
export async function calcularCustosVariaveisAgregados(): Promise<CustoVariavelAgregado> {
  const custos = await listarCustosVariaveis();
  const ativos = custos.filter((custo) => custo.ativo);

  return {
    percentualTotal: ativos
      .filter((custo) => custo.tipo === "percentual_sobre_venda")
      .reduce((total, custo) => total + custo.valor, 0),
    fixoTotal: ativos
      .filter((custo) => custo.tipo === "valor_fixo_por_venda")
      .reduce((total, custo) => total + custo.valor, 0),
  };
}

export async function listarCanaisVenda(): Promise<Tables<"canais_venda">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("canais_venda")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("tipo", { ascending: true })
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}

export type FichaTecnicaParaFinanceiro = Pick<
  Tables<"fichas_tecnicas">,
  | "id"
  | "nome"
  | "custo_por_porcao"
  | "preco_venda_praticado"
  | "preco_sugerido"
  | "rendimento_quantidade"
> & {
  unidades_medida: Pick<Tables<"unidades_medida">, "sigla">;
};

/** Fichas técnicas ativas com os campos de custo/preço já calculados pelo módulo de Ficha Técnica — entrada padrão de Precificação, Ponto de Equilíbrio e Simulador. */
export async function listarFichasTecnicasParaFinanceiro(): Promise<
  FichaTecnicaParaFinanceiro[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas")
    .select(
      "id, nome, custo_por_porcao, preco_venda_praticado, preco_sugerido, rendimento_quantidade, unidades_medida(sigla)",
    )
    .eq("empresa_id", empresa.id)
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data as unknown as FichaTecnicaParaFinanceiro[];
}

export async function listarPlanoContas(): Promise<Tables<"plano_contas">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plano_contas")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("codigo", { ascending: true });

  if (error) throw error;
  return data;
}

export async function listarCentrosCusto(): Promise<Tables<"centros_custo">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("centros_custo")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("codigo", { ascending: true });

  if (error) throw error;
  return data;
}

export interface FichaCustoDesatualizado {
  fichaTecnicaId: string;
  fichaTecnicaNome: string;
  ingredienteNome: string;
  custoSnapshot: number;
  custoAtual: number;
}

/**
 * Compara o custo do ingrediente usado em cada item de ficha técnica
 * (snapshot imutável, `custo_unitario_utilizado`) com o custo ATUAL do
 * ingrediente (`ingredientes.custo_unitario_atual`, atualizado a cada
 * entrada de estoque — ver Sprint 02). Reaproveita 100% os dados de Ficha
 * Técnica + Estoque/Compras, sem nenhuma tabela nova: um item "desatualizado"
 * é só um sinal de que o preço de custo mudou desde que a ficha foi salva.
 */
export async function listarFichasComCustoDesatualizado(): Promise<
  FichaCustoDesatualizado[]
> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fichas_tecnicas_itens")
    .select(
      "custo_unitario_utilizado, fichas_tecnicas!inner(id, nome, empresa_id, ativo), ingredientes(nome, custo_unitario_atual)",
    )
    .eq("fichas_tecnicas.empresa_id", empresa.id)
    .eq("fichas_tecnicas.ativo", true);

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    custo_unitario_utilizado: number;
    fichas_tecnicas: { id: string; nome: string };
    ingredientes: { nome: string; custo_unitario_atual: number };
  }>)
    .filter(
      (item) =>
        Math.abs(
          item.ingredientes.custo_unitario_atual -
            item.custo_unitario_utilizado,
        ) > 0.001,
    )
    .map((item) => ({
      fichaTecnicaId: item.fichas_tecnicas.id,
      fichaTecnicaNome: item.fichas_tecnicas.nome,
      ingredienteNome: item.ingredientes.nome,
      custoSnapshot: item.custo_unitario_utilizado,
      custoAtual: item.ingredientes.custo_unitario_atual,
    }));
}

export async function listarFuncionarios(): Promise<Tables<"funcionarios">[]> {
  const empresa = await getEmpresaAtual();
  if (!empresa) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("empresa_id", empresa.id)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data;
}
