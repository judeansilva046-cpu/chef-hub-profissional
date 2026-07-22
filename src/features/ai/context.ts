import "server-only";

import { analisarVendas } from "@/features/dashboard/calculations";
import {
  calcularCustosVariaveisAgregados,
  listarCanaisVenda,
} from "@/features/financeiro/queries";
import { montarContextoIaCompras } from "@/features/estoque/inteligente/queries";
import { resolverComparativo } from "@/features/bi/periods";
import { margemPercentual } from "@/features/bi/calculations";
import { buscarVendasPorPeriodo } from "@/features/vendas/queries";
import { createClient } from "@/lib/supabase/server";
import { getEmpresaAtual } from "@/server/auth/get-empresa-atual";

import type { ChefHubAiContexto } from "./types";

/**
 * Monta o contexto do copiloto exclusivamente com dados da empresa ativa.
 */
export async function montarContextoChefHubAi(): Promise<ChefHubAiContexto> {
  const comp = resolverComparativo("semana_semana");
  const empresa = await getEmpresaAtual();
  const supabase = await createClient();

  const [vendasAtual, vendasAnt, custos, canais, iaCompras] =
    await Promise.all([
      buscarVendasPorPeriodo({
        dataInicio: comp.atual.inicio,
        dataFim: comp.atual.fim,
      }),
      buscarVendasPorPeriodo({
        dataInicio: comp.anterior.inicio,
        dataFim: comp.anterior.fim,
      }),
      calcularCustosVariaveisAgregados(),
      listarCanaisVenda(),
      montarContextoIaCompras().catch(() => null),
    ]);

  const canaisPorId = new Map(
    canais.map((c) => [
      c.id,
      {
        taxa_percentual: Number(c.taxa_percentual ?? 0),
        taxa_fixa: Number(c.taxa_fixa ?? 0),
      },
    ]),
  );

  const analiseAtual = analisarVendas(vendasAtual, custos, canaisPorId);
  const analiseAnt = analisarVendas(vendasAnt, custos, canaisPorId);

  const fichaIds = [
    ...new Set([
      ...analiseAtual.porProduto.map((p) => p.fichaTecnicaId),
      ...analiseAnt.porProduto.map((p) => p.fichaTecnicaId),
    ]),
  ];

  const nomesFichas = new Map<string, string>();
  const fichasCtx: ChefHubAiContexto["fichas"] = [];

  if (empresa) {
    const { data: fichas } = await supabase
      .from("fichas_tecnicas")
      .select(
        "id, nome, custo_por_porcao, preco_venda_praticado, preco_sugerido, margem_contribuicao_percentual",
      )
      .eq("empresa_id", empresa.id)
      .eq("ativo", true)
      .limit(200);

    for (const f of fichas ?? []) {
      nomesFichas.set(f.id, f.nome);
      const preco = Number(f.preco_venda_praticado ?? f.preco_sugerido ?? 0);
      fichasCtx.push({
        id: f.id,
        nome: f.nome,
        custoPorPorcao: Number(f.custo_por_porcao ?? 0),
        preco,
        margemPct:
          f.margem_contribuicao_percentual != null
            ? Number(f.margem_contribuicao_percentual)
            : null,
      });
    }

    // enriquecer nomes só das vendidas
    if (fichaIds.length > 0) {
      const missing = fichaIds.filter((id) => !nomesFichas.has(id));
      if (missing.length > 0) {
        const { data: extra } = await supabase
          .from("fichas_tecnicas")
          .select("id, nome")
          .eq("empresa_id", empresa.id)
          .in("id", missing.slice(0, 100));
        for (const f of extra ?? []) nomesFichas.set(f.id, f.nome);
      }
    }
  }

  const produtosLucrativos = analiseAtual.porProduto.map((p) => ({
    id: p.fichaTecnicaId,
    nome: nomesFichas.get(p.fichaTecnicaId) ?? p.fichaTecnicaId.slice(0, 8),
    faturamento: p.faturamento,
    margem: p.margem,
    quantidade: p.quantidadeVendida,
  }));

  // Fornecedores / variação de preço
  const fornecedoresPreco: ChefHubAiContexto["fornecedoresPreco"] = [];
  if (empresa) {
    const { data: fi } = await supabase
      .from("fornecedor_ingredientes")
      .select(
        "preco_unitario, fornecedor_id, ingrediente_id, fornecedores(nome), ingredientes(id, nome)",
      )
      .eq("empresa_id", empresa.id)
      .limit(300);

    const ingIds = [
      ...new Set((fi ?? []).map((r) => r.ingrediente_id).filter(Boolean)),
    ] as string[];

    const historicoPorIng = new Map<string, number>();
    if (ingIds.length > 0) {
      const { data: hist } = await supabase
        .from("ingredientes_historico_precos")
        .select("ingrediente_id, custo_unitario, data_referencia")
        .in("ingrediente_id", ingIds.slice(0, 200))
        .order("data_referencia", { ascending: true });

      // pega o mais antigo como referência de "antes"
      for (const h of hist ?? []) {
        if (!historicoPorIng.has(h.ingrediente_id)) {
          historicoPorIng.set(h.ingrediente_id, Number(h.custo_unitario));
        }
      }
    }

    for (const row of fi ?? []) {
      const forn = row.fornecedores as { nome: string } | null;
      const ing = row.ingredientes as { id: string; nome: string } | null;
      const atual = Number(row.preco_unitario ?? 0);
      const anterior = historicoPorIng.get(row.ingrediente_id) ?? null;
      const variacaoPct =
        anterior != null && anterior > 0
          ? Math.round(((atual - anterior) / anterior) * 1000) / 10
          : null;
      fornecedoresPreco.push({
        fornecedorNome: forn?.nome ?? "Fornecedor",
        ingredienteNome: ing?.nome ?? "Insumo",
        precoAtual: atual,
        precoAnterior: anterior,
        variacaoPct,
      });
    }
  }

  // Perdas
  const perdas: ChefHubAiContexto["perdas"] = [];
  if (empresa) {
    const { data: losses } = await supabase
      .from("inventory_losses")
      .select("quantity, unit_cost, total_cost, ingrediente_id")
      .eq("empresa_id", empresa.id)
      .gte("lost_at", comp.atual.inicio)
      .lte("lost_at", `${comp.atual.fim}T23:59:59`)
      .limit(200);

    const lossIngIds = [
      ...new Set((losses ?? []).map((l) => l.ingrediente_id).filter(Boolean)),
    ] as string[];
    const nomesIng = new Map<string, string>();
    if (lossIngIds.length > 0) {
      const { data: ings } = await supabase
        .from("ingredientes")
        .select("id, nome")
        .eq("empresa_id", empresa.id)
        .in("id", lossIngIds.slice(0, 200));
      for (const i of ings ?? []) nomesIng.set(i.id, i.nome);
    }

    const map = new Map<string, { nome: string; quantidade: number; custo: number }>();
    for (const l of losses ?? []) {
      const nome = nomesIng.get(l.ingrediente_id) ?? "Item";
      const custo =
        l.total_cost != null
          ? Number(l.total_cost)
          : Number(l.unit_cost ?? 0) * Number(l.quantity ?? 0);
      const a = map.get(nome) ?? { nome, quantidade: 0, custo: 0 };
      a.quantidade += Number(l.quantity ?? 0);
      a.custo += custo;
      map.set(nome, a);
    }
    perdas.push(...map.values());
  }
  if (perdas.length === 0 && iaCompras) {
    perdas.push(...iaCompras.perdasPorProduto);
  }

  // Garçom × sobremesas
  const garcomSobremesas: ChefHubAiContexto["garcomSobremesas"] = [];
  if (empresa) {
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select(
        "id, responsavel_id, profiles:responsavel_id(nome_completo), pedido_itens(quantidade, preco_unitario_praticado, fichas_tecnicas(nome))",
      )
      .eq("empresa_id", empresa.id)
      .gte("criado_em", `${comp.atual.inicio}T00:00:00`)
      .lte("criado_em", `${comp.atual.fim}T23:59:59`)
      .not("responsavel_id", "is", null)
      .limit(150);

    const map = new Map<
      string,
      { garcomNome: string; quantidade: number; faturamento: number }
    >();

    for (const p of pedidos ?? []) {
      const perfil = p.profiles as { nome_completo?: string } | null;
      const garcomNome = perfil?.nome_completo ?? "Garçom";
      const itens = (p.pedido_itens ?? []) as Array<{
        quantidade: number;
        preco_unitario_praticado: number;
        fichas_tecnicas?: { nome: string } | null;
      }>;
      for (const item of itens) {
        const nomeItem = (item.fichas_tecnicas?.nome ?? "").toLowerCase();
        if (
          !/(sobremesa|doce|dessert|pudim|mousse|brownie|torta|sorvete|petit)/i.test(
            nomeItem,
          )
        ) {
          continue;
        }
        const key = p.responsavel_id ?? garcomNome;
        const a = map.get(key) ?? {
          garcomNome,
          quantidade: 0,
          faturamento: 0,
        };
        a.quantidade += Number(item.quantidade ?? 0);
        a.faturamento +=
          Number(item.quantidade ?? 0) *
          Number(item.preco_unitario_praticado ?? 0);
        map.set(key, a);
      }
    }
    garcomSobremesas.push(...map.values());
  }

  // Campanhas CRM
  const campanhas: ChefHubAiContexto["campanhas"] = [];
  if (empresa) {
    const { data: camps } = await supabase
      .from("marketing_campaigns")
      .select("name, status, channel, metrics")
      .eq("empresa_id", empresa.id)
      .order("created_at", { ascending: false })
      .limit(30);

    for (const c of camps ?? []) {
      const m = (c.metrics ?? {}) as Record<string, unknown>;
      campanhas.push({
        nome: c.name,
        status: c.status,
        channel: c.channel,
        enviados: Number(m.sent ?? m.enviados ?? m.delivered ?? 0),
        convertidos: Number(m.converted ?? m.convertidos ?? m.conversions ?? 0),
        receita: Number(m.revenue ?? m.receita ?? 0),
      });
    }
  }

  // Clientes inativos 60d
  const clientesInativos: ChefHubAiContexto["clientesInativos"] = [];
  if (empresa) {
    const { data: vendasCli } = await supabase
      .from("vendas")
      .select("cliente_id, valor_total, data_venda, clientes(nome)")
      .eq("empresa_id", empresa.id)
      .not("cliente_id", "is", null)
      .order("data_venda", { ascending: false })
      .limit(2000);

    const last = new Map<
      string,
      { nome: string; ultima: string; total: number }
    >();
    for (const v of vendasCli ?? []) {
      if (!v.cliente_id) continue;
      const cli = v.clientes as { nome: string } | null;
      const cur = last.get(v.cliente_id);
      if (!cur) {
        last.set(v.cliente_id, {
          nome: cli?.nome ?? "Cliente",
          ultima: v.data_venda,
          total: Number(v.valor_total ?? 0),
        });
      } else {
        cur.total += Number(v.valor_total ?? 0);
        if (v.data_venda > cur.ultima) cur.ultima = v.data_venda;
      }
    }
    const agora = Date.now();
    for (const c of last.values()) {
      const dias = Math.floor(
        (agora - new Date(c.ultima).getTime()) / 86_400_000,
      );
      if (dias >= 60) {
        clientesInativos.push({
          nome: c.nome,
          dias,
          totalGasto: c.total,
        });
      }
    }
    clientesInativos.sort((a, b) => b.dias - a.dias);
  }

  // Receita por canal (pedidos)
  const receitaPorCanal: ChefHubAiContexto["receitaPorCanal"] = [];
  if (empresa) {
    const { data: peds } = await supabase
      .from("pedidos")
      .select("total, status, cancelado_em, canal_venda_id, canais_venda(nome)")
      .eq("empresa_id", empresa.id)
      .gte("criado_em", `${comp.atual.inicio}T00:00:00`)
      .lte("criado_em", `${comp.atual.fim}T23:59:59`)
      .limit(500);

    const map = new Map<string, { nome: string; receita: number; qtd: number }>();
    for (const p of peds ?? []) {
      if (p.cancelado_em || p.status === "cancelado") continue;
      const canal = p.canais_venda as { nome: string } | null;
      const key = p.canal_venda_id ?? "sem";
      const a = map.get(key) ?? {
        nome: canal?.nome ?? "Sem canal",
        receita: 0,
        qtd: 0,
      };
      a.receita += Number(p.total ?? 0);
      a.qtd += 1;
      map.set(key, a);
    }
    receitaPorCanal.push(...map.values());
  }

  const comprasUrgentes =
    iaCompras?.previsoes
      .filter(
        (p) =>
          p.quantidadeSugerida > 0 &&
          (p.prioridade === "critica" || p.prioridade === "alta"),
      )
      .map((p) => ({
        nome: p.nome,
        quantidadeSugerida: p.quantidadeSugerida,
        prioridade: p.prioridade,
        comprarAte: p.comprarAte,
        fornecedorNome: p.fornecedorNome,
      })) ?? [];

  return {
    periodoAtual: {
      inicio: comp.atual.inicio,
      fim: comp.atual.fim,
      label: comp.label.split("×")[0]?.trim() ?? "Atual",
    },
    periodoAnterior: {
      inicio: comp.anterior.inicio,
      fim: comp.anterior.fim,
      label: "período anterior",
    },
    financeiro: {
      receitaAtual: analiseAtual.resumo.faturamentoRealizado,
      receitaAnterior: analiseAnt.resumo.faturamentoRealizado,
      lucroAtual: analiseAtual.resumo.margemRealizada,
      lucroAnterior: analiseAnt.resumo.margemRealizada,
      cmvAtual: analiseAtual.resumo.cmvRealizado,
      cmvAnterior: analiseAnt.resumo.cmvRealizado,
      margemAtualPct: margemPercentual(
        analiseAtual.resumo.margemRealizada,
        analiseAtual.resumo.faturamentoRealizado,
      ),
      margemAnteriorPct: margemPercentual(
        analiseAnt.resumo.margemRealizada,
        analiseAnt.resumo.faturamentoRealizado,
      ),
    },
    produtosLucrativos,
    perdas,
    comprasUrgentes,
    fornecedoresPreco,
    garcomSobremesas,
    campanhas,
    clientesInativos,
    receitaPorCanal,
    fichas: fichasCtx,
    custosVariaveis: custos,
  };
}
