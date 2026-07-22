import { formatarMoeda } from "@/lib/format";

import {
  detectarIntencao,
  extrairNomePrato,
  extrairPercentual,
  SUGESTOES_CHEFHUB_AI,
} from "./intents";
import type {
  ChefHubAiContexto,
  ChefHubAiFonte,
  ChefHubAiResposta,
} from "./types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deltaPct(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return round2(((atual - anterior) / Math.abs(anterior)) * 100);
}

function fontes(...items: ChefHubAiFonte[]): ChefHubAiFonte[] {
  return items;
}

export function responderChefHubAi(
  pergunta: string,
  ctx: ChefHubAiContexto,
): ChefHubAiResposta {
  const intencao = detectarIntencao(pergunta);
  const sugestoes = [...SUGESTOES_CHEFHUB_AI].slice(0, 4);

  switch (intencao) {
    case "lucro_caiu":
      return responderLucro(pergunta, ctx, sugestoes);
    case "fornecedor_preco":
      return responderFornecedor(pergunta, ctx, sugestoes);
    case "comprar_amanha":
      return responderCompras(pergunta, ctx, sugestoes);
    case "desperdicio":
      return responderDesperdicio(pergunta, ctx, sugestoes);
    case "garcom_sobremesas":
      return responderGarcom(pergunta, ctx, sugestoes);
    case "campanha_clientes":
      return responderCampanha(pergunta, ctx, sugestoes);
    case "simulacao_preco":
      return responderSimulacao(pergunta, ctx, sugestoes);
    case "previsao_vendas":
      return responderPrevisao(pergunta, ctx, sugestoes);
    case "produtos_lucrativos":
      return responderProdutos(pergunta, ctx, sugestoes);
    case "cmv_subiu":
      return responderCmv(pergunta, ctx, sugestoes);
    case "clientes_inativos":
      return responderInativos(pergunta, ctx, sugestoes);
    case "unidade_melhor":
      return responderCanal(pergunta, ctx, sugestoes);
    default:
      return {
        pergunta,
        intencao: "desconhecida",
        resposta:
          "Ainda não entendi. Posso analisar lucro, CMV, compras, desperdício, fornecedores, campanhas, canais, clientes inativos e simulações de preço — sempre com base nos dados do seu restaurante.",
        explicacao:
          "Nenhuma intenção mapeada. O copiloto usa regras sobre indicadores do ERP/BI (sem modelo externo).",
        fontes: fontes({
          modulo: "ai",
          descricao: "Catálogo de intenções ChefHub AI",
        }),
        sugestoes: [...SUGESTOES_CHEFHUB_AI],
      };
  }
}

function responderLucro(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const { financeiro: f } = ctx;
  const dReceita = deltaPct(f.receitaAtual, f.receitaAnterior);
  const dLucro = deltaPct(f.lucroAtual, f.lucroAnterior);
  const dCmv = deltaPct(f.cmvAtual, f.cmvAnterior);

  const causas: string[] = [];
  if (dReceita != null && dReceita < 0) {
    causas.push(
      `receita caiu ${Math.abs(dReceita)}% (${formatarMoeda(f.receitaAnterior)} → ${formatarMoeda(f.receitaAtual)})`,
    );
  }
  if (dCmv != null && dCmv > 0) {
    causas.push(
      `CMV subiu ${dCmv}% (${formatarMoeda(f.cmvAnterior)} → ${formatarMoeda(f.cmvAtual)})`,
    );
  }
  if (
    f.margemAtualPct != null &&
    f.margemAnteriorPct != null &&
    f.margemAtualPct < f.margemAnteriorPct
  ) {
    causas.push(
      `margem recuou de ${f.margemAnteriorPct}% para ${f.margemAtualPct}%`,
    );
  }
  if (causas.length === 0 && (dLucro == null || dLucro >= 0)) {
    return {
      pergunta,
      intencao: "lucro_caiu",
      resposta: `No recorte ${ctx.periodoAtual.label}, o lucro não caiu frente a ${ctx.periodoAnterior.label}: ${formatarMoeda(f.lucroAtual)} vs ${formatarMoeda(f.lucroAnterior)}${dLucro != null ? ` (${dLucro > 0 ? "+" : ""}${dLucro}%)` : ""}.`,
      explicacao:
        "Comparei lucro, receita, CMV e margem do período atual com o período anterior equivalente (vendas + custos variáveis).",
      fontes: fontes(
        { modulo: "vendas", descricao: "Vendas agregadas do período" },
        { modulo: "financeiro", descricao: "CMV e margem de contribuição" },
      ),
      dados: f,
      sugestoes,
    };
  }

  return {
    pergunta,
    intencao: "lucro_caiu",
    resposta:
      `Lucro ${ctx.periodoAtual.label}: ${formatarMoeda(f.lucroAtual)} vs ${formatarMoeda(f.lucroAnterior)}` +
      `${dLucro != null ? ` (${dLucro}%)` : ""}.\n` +
      (causas.length
        ? `Principais fatores:\n${causas.map((c) => `• ${c}`).join("\n")}`
        : "A queda parece concentrada na combinação receita/CMV; revise mix de canais e custos."),
    explicacao:
      "Calculei lucro (margem de contribuição realizada) em dois períodos. Atribui a variação a queda de receita e/ou alta de CMV quando os deltas apontam nessa direção.",
    fontes: fontes(
      { modulo: "bi", descricao: "Comparativo período atual × anterior" },
      { modulo: "vendas", descricao: "analisarVendas / faturamento e CMV" },
    ),
    dados: { financeiro: f, causas },
    sugestoes,
  };
}

function responderFornecedor(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const ranked = [...ctx.fornecedoresPreco]
    .filter((f) => f.variacaoPct != null && f.variacaoPct > 0)
    .sort((a, b) => (b.variacaoPct ?? 0) - (a.variacaoPct ?? 0))
    .slice(0, 8);

  if (ranked.length === 0) {
    return {
      pergunta,
      intencao: "fornecedor_preco",
      resposta:
        "Não encontrei aumentos de preço relevantes no histórico recente de insumos/fornecedores.",
      explicacao:
        "Cruzei preços atuais de fornecedor_ingredientes com o histórico de custos (ingredientes_historico_precos).",
      fontes: fontes({
        modulo: "compras",
        descricao: "Preços de fornecedor e histórico de insumos",
      }),
      sugestoes,
    };
  }

  return {
    pergunta,
    intencao: "fornecedor_preco",
    resposta:
      "Maiores altas de preço detectadas:\n" +
      ranked
        .map(
          (f) =>
            `• ${f.fornecedorNome} — ${f.ingredienteNome}: ${formatarMoeda(f.precoAnterior ?? 0)} → ${formatarMoeda(f.precoAtual)} (${f.variacaoPct! > 0 ? "+" : ""}${f.variacaoPct}%)`,
        )
        .join("\n"),
    explicacao:
      "Ordenei pela variação percentual entre o custo histórico de referência e o preço unitário atual do fornecedor.",
    fontes: fontes(
      { modulo: "compras", descricao: "fornecedor_ingredientes" },
      { modulo: "estoque", descricao: "ingredientes_historico_precos" },
    ),
    dados: ranked,
    sugestoes,
  };
}

function responderCompras(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const urgentes = ctx.comprasUrgentes.slice(0, 8);
  if (urgentes.length === 0) {
    return {
      pergunta,
      intencao: "comprar_amanha",
      resposta:
        "Nenhum item crítico para comprar amanhã — cobertura dentro do mínimo no horizonte curto.",
      explicacao:
        "Usei as previsões do estoque inteligente (consumo médio × cobertura × lead time).",
      fontes: fontes({
        modulo: "estoque",
        descricao: "Previsões / sugestões de compra",
      }),
      sugestoes,
    };
  }
  return {
    pergunta,
    intencao: "comprar_amanha",
    resposta:
      "Sugestão de compra prioritária:\n" +
      urgentes
        .map(
          (p) =>
            `• ${p.nome}: ${p.quantidadeSugerida} (${p.prioridade}) até ${p.comprarAte}${p.fornecedorNome ? ` · ${p.fornecedorNome}` : ""}`,
        )
        .join("\n"),
    explicacao:
      "Priorizei itens com prioridade crítica/alta nas previsões de compra do módulo de estoque inteligente.",
    fontes: fontes({
      modulo: "estoque",
      descricao: "purchase_suggestions / previsões",
    }),
    dados: urgentes,
    sugestoes,
  };
}

function responderDesperdicio(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const top = [...ctx.perdas].sort((a, b) => b.custo - a.custo).slice(0, 8);
  if (top.length === 0) {
    return {
      pergunta,
      intencao: "desperdicio",
      resposta: "Nenhuma perda registrada no período analisado.",
      explicacao: "Consultei inventory_losses agregadas por ingrediente/produto.",
      fontes: fontes({ modulo: "estoque", descricao: "inventory_losses" }),
      sugestoes,
    };
  }
  const total = top.reduce((s, p) => s + p.custo, 0);
  return {
    pergunta,
    intencao: "desperdicio",
    resposta:
      `Desperdício (custo) no período — total top: ${formatarMoeda(total)}\n` +
      top
        .map(
          (p) =>
            `• ${p.nome}: ${p.quantidade} un · ${formatarMoeda(p.custo)}`,
        )
        .join("\n"),
    explicacao:
      "Somei custo das perdas registradas e ordenei do maior para o menor impacto financeiro.",
    fontes: fontes({ modulo: "estoque", descricao: "Perdas / desperdício" }),
    dados: top,
    sugestoes,
  };
}

function responderGarcom(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const top = [...ctx.garcomSobremesas].sort(
    (a, b) => b.quantidade - a.quantidade,
  );
  if (top.length === 0) {
    return {
      pergunta,
      intencao: "garcom_sobremesas",
      resposta:
        "Não há vendas de sobremesa atribuídas a garçons no período (ou os itens não foram classificados como sobremesa).",
      explicacao:
        "Cruzei pedidos (responsável) com itens cujo nome contém sobremesa/doce/dessert.",
      fontes: fontes(
        { modulo: "pedidos", descricao: "pedido_itens + responsavel" },
        { modulo: "cardapio", descricao: "Nome da ficha técnica" },
      ),
      sugestoes,
    };
  }
  const lider = top[0]!;
  return {
    pergunta,
    intencao: "garcom_sobremesas",
    resposta:
      `Quem mais vende sobremesas: ${lider.garcomNome} (${lider.quantidade} un · ${formatarMoeda(lider.faturamento)}).\n` +
      top
        .slice(0, 5)
        .map(
          (g) =>
            `• ${g.garcomNome}: ${g.quantidade} un · ${formatarMoeda(g.faturamento)}`,
        )
        .join("\n"),
    explicacao:
      "Agreguei quantidade e valor de itens de sobremesa por responsável do pedido (garçom).",
    fontes: fontes({ modulo: "pedidos", descricao: "Vendas por responsável" }),
    dados: top.slice(0, 8),
    sugestoes,
  };
}

function responderCampanha(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const ranked = [...ctx.campanhas].sort((a, b) => {
    if (b.convertidos !== a.convertidos) return b.convertidos - a.convertidos;
    return b.receita - a.receita;
  });
  if (ranked.length === 0) {
    return {
      pergunta,
      intencao: "campanha_clientes",
      resposta: "Nenhuma campanha com métricas no CRM ainda.",
      explicacao:
        "Li marketing_campaigns.metrics (enviados/convertidos/receita quando disponíveis).",
      fontes: fontes({ modulo: "crm", descricao: "marketing_campaigns" }),
      sugestoes,
    };
  }
  const best = ranked[0]!;
  return {
    pergunta,
    intencao: "campanha_clientes",
    resposta:
      `Melhor campanha: "${best.nome}" (${best.channel}) — ${best.convertidos} conversões` +
      `${best.receita > 0 ? ` · ${formatarMoeda(best.receita)}` : ""}.\n` +
      ranked
        .slice(0, 5)
        .map(
          (c) =>
            `• ${c.nome}: ${c.convertidos} conv. / ${c.enviados} env. · ${c.status}`,
        )
        .join("\n"),
    explicacao:
      "Ordenei campanhas por conversões (e receita quando houver) registradas nas métricas do CRM.",
    fontes: fontes({ modulo: "crm", descricao: "Campanhas e métricas" }),
    dados: ranked.slice(0, 8),
    sugestoes,
  };
}

function responderSimulacao(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const pct = extrairPercentual(pergunta) ?? 5;
  const nome = extrairNomePrato(pergunta);
  let ficha = nome
    ? ctx.fichas.find((f) =>
        f.nome.toLowerCase().includes(nome.toLowerCase()),
      )
    : null;
  if (!ficha) {
    ficha = [...ctx.fichas].sort((a, b) => b.preco - a.preco)[0] ?? null;
  }
  if (!ficha || ficha.preco <= 0) {
    return {
      pergunta,
      intencao: "simulacao_preco",
      resposta:
        "Não encontrei ficha técnica com preço para simular. Cadastre preço praticado na ficha.",
      explicacao: "Simulação requer custo por porção e preço de venda da ficha.",
      fontes: fontes({ modulo: "fichas", descricao: "fichas_tecnicas" }),
      sugestoes,
    };
  }

  const cv = ctx.custosVariaveis;
  const custoVarAtual =
    ficha.preco * (cv.percentualTotal / 100) + cv.fixoTotal;
  const margemAtual = ficha.preco - ficha.custoPorPorcao - custoVarAtual;
  const margemAtualPct = (margemAtual / ficha.preco) * 100;

  const novoPreco = ficha.preco * (1 + pct / 100);
  const custoVarNovo =
    novoPreco * (cv.percentualTotal / 100) + cv.fixoTotal;
  const margemNova = novoPreco - ficha.custoPorPorcao - custoVarNovo;
  const margemNovaPct = (margemNova / novoPreco) * 100;

  return {
    pergunta,
    intencao: "simulacao_preco",
    resposta:
      `Simulação — ${ficha.nome}: aumento de ${pct}% no preço.\n` +
      `• Preço: ${formatarMoeda(ficha.preco)} → ${formatarMoeda(round2(novoPreco))}\n` +
      `• Margem unitária: ${formatarMoeda(round2(margemAtual))} → ${formatarMoeda(round2(margemNova))} (${round2(margemNova - margemAtual) >= 0 ? "+" : ""}${formatarMoeda(round2(margemNova - margemAtual))})\n` +
      `• Margem %: ${round2(margemAtualPct)}% → ${round2(margemNovaPct)}% (${round2(margemNovaPct - margemAtualPct) >= 0 ? "+" : ""}${round2(margemNovaPct - margemAtualPct)} p.p.)\n` +
      `Obs.: não modeleielasticidade de demanda — só o efeito contábil na margem unitária.`,
    explicacao:
      "Apliquei margem de contribuição real (preço − custo da ficha − custos variáveis %). O percentual veio da pergunta (padrão 5% se omitido).",
    fontes: fontes(
      { modulo: "fichas", descricao: "Custo e preço da ficha técnica" },
      { modulo: "financeiro", descricao: "Custos variáveis agregados" },
    ),
    dados: {
      fichaId: ficha.id,
      pct,
      precoAtual: ficha.preco,
      novoPreco: round2(novoPreco),
      margemAtual: round2(margemAtual),
      margemNova: round2(margemNova),
      margemAtualPct: round2(margemAtualPct),
      margemNovaPct: round2(margemNovaPct),
    },
    sugestoes,
  };
}

function responderPrevisao(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  // Projeção simples: receita do período atual anualizada por dia × 7
  const dias = Math.max(
    1,
    (new Date(`${ctx.periodoAtual.fim}T12:00:00`).getTime() -
      new Date(`${ctx.periodoAtual.inicio}T12:00:00`).getTime()) /
      86_400_000 +
      1,
  );
  const mediaDiaria = ctx.financeiro.receitaAtual / dias;
  const projSemana = round2(mediaDiaria * 7);
  const tendencia = deltaPct(
    ctx.financeiro.receitaAtual,
    ctx.financeiro.receitaAnterior,
  );

  return {
    pergunta,
    intencao: "previsao_vendas",
    resposta:
      `Projeção de vendas (heurística):\n` +
      `• Média diária no período: ${formatarMoeda(round2(mediaDiaria))}\n` +
      `• Estimativa para 7 dias: ${formatarMoeda(projSemana)}\n` +
      (tendencia != null
        ? `• Tendência vs período anterior: ${tendencia > 0 ? "+" : ""}${tendencia}%\n`
        : "") +
      `Baseado apenas no histórico do seu restaurante — não é garantia.`,
    explicacao:
      "Extrapolação linear da receita média diária do período selecionado × 7 dias, com delta vs período anterior.",
    fontes: fontes({ modulo: "vendas", descricao: "Receita do período" }),
    dados: { mediaDiaria, projSemana, tendencia, dias },
    sugestoes,
  };
}

function responderProdutos(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const top = [...ctx.produtosLucrativos]
    .sort((a, b) => b.margem - a.margem)
    .slice(0, 8);
  if (top.length === 0) {
    return {
      pergunta,
      intencao: "produtos_lucrativos",
      resposta: "Sem vendas no período para ranquear produtos.",
      explicacao: "Agregação de margem por ficha técnica nas vendas.",
      fontes: fontes({ modulo: "vendas", descricao: "Rentabilidade por produto" }),
      sugestoes,
    };
  }
  return {
    pergunta,
    intencao: "produtos_lucrativos",
    resposta:
      "Produtos com maior lucro (margem) no período:\n" +
      top
        .map(
          (p) =>
            `• ${p.nome}: margem ${formatarMoeda(p.margem)} · fat. ${formatarMoeda(p.faturamento)} (${p.quantidade} un)`,
        )
        .join("\n"),
    explicacao:
      "Ordenei por margem de contribuição total realizada (após CMV e custos variáveis).",
    fontes: fontes({ modulo: "bi", descricao: "analisarVendas.porProduto" }),
    dados: top,
    sugestoes,
  };
}

function responderCmv(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const f = ctx.financeiro;
  const dCmv = deltaPct(f.cmvAtual, f.cmvAnterior);
  const cmvPctAtual =
    f.receitaAtual > 0 ? round2((f.cmvAtual / f.receitaAtual) * 100) : null;
  const cmvPctAnt =
    f.receitaAnterior > 0
      ? round2((f.cmvAnterior / f.receitaAnterior) * 100)
      : null;

  const altas = [...ctx.fornecedoresPreco]
    .filter((x) => (x.variacaoPct ?? 0) > 0)
    .sort((a, b) => (b.variacaoPct ?? 0) - (a.variacaoPct ?? 0))
    .slice(0, 3);

  return {
    pergunta,
    intencao: "cmv_subiu",
    resposta:
      `CMV ${ctx.periodoAtual.label}: ${formatarMoeda(f.cmvAtual)}` +
      `${cmvPctAtual != null ? ` (${cmvPctAtual}% da receita)` : ""}\n` +
      `Anterior: ${formatarMoeda(f.cmvAnterior)}` +
      `${cmvPctAnt != null ? ` (${cmvPctAnt}%)` : ""}` +
      `${dCmv != null ? ` · Δ ${dCmv}%` : ""}.\n` +
      (altas.length
        ? `Insumos com alta de preço que podem explicar parte do movimento:\n${altas
            .map(
              (a) =>
                `• ${a.ingredienteNome} (${a.fornecedorNome}): +${a.variacaoPct}%`,
            )
            .join("\n")}`
        : "Sem altas claras de insumos no histórico — revise mix de produtos e desperdício."),
    explicacao:
      "Comparei CMV absoluto e % sobre receita entre períodos e cruzei com variações de preço de insumos.",
    fontes: fontes(
      { modulo: "vendas", descricao: "CMV realizado" },
      { modulo: "compras", descricao: "Variação de preços" },
    ),
    dados: { financeiro: f, altas },
    sugestoes,
  };
}

function responderInativos(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const top = ctx.clientesInativos.slice(0, 10);
  if (top.length === 0) {
    return {
      pergunta,
      intencao: "clientes_inativos",
      resposta: "Nenhum cliente inativo (60+ dias sem compra) encontrado.",
      explicacao:
        "Calculei dias desde a última venda por cliente_id nas vendas.",
      fontes: fontes({ modulo: "crm", descricao: "Clientes + vendas" }),
      sugestoes,
    };
  }
  return {
    pergunta,
    intencao: "clientes_inativos",
    resposta:
      `Clientes sem compra há 60+ dias (${top.length} listados):\n` +
      top
        .map(
          (c) =>
            `• ${c.nome}: ${c.dias} dias · histórico ${formatarMoeda(c.totalGasto)}`,
        )
        .join("\n"),
    explicacao:
      "Filtrei clientes com última compra há mais de 60 dias e ordenei pelos mais antigos.",
    fontes: fontes({ modulo: "crm", descricao: "Retenção / inativos" }),
    dados: top,
    sugestoes,
  };
}

function responderCanal(
  pergunta: string,
  ctx: ChefHubAiContexto,
  sugestoes: string[],
): ChefHubAiResposta {
  const ranked = [...ctx.receitaPorCanal].sort((a, b) => b.receita - a.receita);
  if (ranked.length === 0) {
    return {
      pergunta,
      intencao: "unidade_melhor",
      resposta: "Sem receita por canal no período.",
      explicacao: "Agregação de pedidos/vendas por canal_venda.",
      fontes: fontes({ modulo: "bi", descricao: "Receita por canal" }),
      sugestoes,
    };
  }
  const best = ranked[0]!;
  return {
    pergunta,
    intencao: "unidade_melhor",
    resposta:
      `Melhor canal/unidade no período: ${best.nome} — ${formatarMoeda(best.receita)} (${best.qtd} pedidos).\n` +
      ranked
        .slice(0, 6)
        .map(
          (c) =>
            `• ${c.nome}: ${formatarMoeda(c.receita)} · ${c.qtd} ped.`,
        )
        .join("\n"),
    explicacao:
      "Sem tabela de filiais, “unidade” = canal de venda. Ordenei por receita no período.",
    fontes: fontes({ modulo: "bi", descricao: "Drill-down por canal" }),
    dados: ranked,
    sugestoes,
  };
}
