import { formatarMoeda } from "@/lib/format";

import type {
  AlertaEstoque,
  ConsumoMedio,
  GiroEstoque,
  ItemAbc,
  PrevisaoCompra,
} from "./calculations";

export interface ContextoIaCompras {
  previsoes: PrevisaoCompra[];
  giros: GiroEstoque[];
  consumos: ConsumoMedio[];
  alertas: AlertaEstoque[];
  abc: ItemAbc[];
  perdasPorProduto: Array<{ nome: string; quantidade: number; custo: number }>;
  valorParado: number;
  fornecedoresBaratos: Array<{
    ingredienteNome: string;
    fornecedorNome: string;
    preco: number;
  }>;
}

export interface RespostaIaCompras {
  pergunta: string;
  resposta: string;
  intencao: string;
  dados?: unknown;
}

type Intencao =
  | "comprar_amanha"
  | "fornecedor_barato"
  | "consumo_semana"
  | "produto_parado"
  | "produto_gira"
  | "dinheiro_parado"
  | "desperdicio"
  | "desconhecida";

export function detectarIntencao(pergunta: string): Intencao {
  const q = pergunta.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

  if (/(comprar|compra).*(amanha|hoje|agora)|o que preciso comprar/.test(q)) {
    return "comprar_amanha";
  }
  if (/fornecedor.*(barato|menor|melhor)|mais barato/.test(q)) {
    return "fornecedor_barato";
  }
  if (/consumir|consumo.*(semana|proxim)|vou consumir/.test(q)) {
    return "consumo_semana";
  }
  if (/dinheiro.*(parado|estoque)|valor.*(parado|estoque)|capital parado/.test(q)) {
    return "dinheiro_parado";
  }
  if (/gira mais|maior giro|mais gira|mais rotativo/.test(q)) {
    return "produto_gira";
  }
  if (/parado|encalhado|sem giro|nao gira/.test(q)) {
    return "produto_parado";
  }
  if (/desperd|perda|quebra|vencimento/.test(q)) {
    return "desperdicio";
  }
  return "desconhecida";
}

/** Responde perguntas operacionais de compras/estoque com base no contexto calculado. */
export function responderIaCompras(
  pergunta: string,
  ctx: ContextoIaCompras,
): RespostaIaCompras {
  const intencao = detectarIntencao(pergunta);

  switch (intencao) {
    case "comprar_amanha": {
      const urgentes = ctx.previsoes
        .filter((p) => p.quantidadeSugerida > 0 && (p.prioridade === "critica" || p.prioridade === "alta"))
        .slice(0, 8);
      if (urgentes.length === 0) {
        return {
          pergunta,
          intencao,
          resposta: "Nenhum item crítico para comprar amanhã. Estoque dentro do mínimo para o horizonte curto.",
          dados: urgentes,
        };
      }
      const linhas = urgentes.map(
        (p) =>
          `• ${p.nome}: ${p.quantidadeSugerida} (até ${p.comprarAte}${p.fornecedorNome ? ` · ${p.fornecedorNome}` : ""})`,
      );
      return {
        pergunta,
        intencao,
        resposta: `Sugestão de compra prioritária:\n${linhas.join("\n")}`,
        dados: urgentes,
      };
    }
    case "fornecedor_barato": {
      if (ctx.fornecedoresBaratos.length === 0) {
        return {
          pergunta,
          intencao,
          resposta: "Ainda não há preços de fornecedores cadastrados para comparar.",
        };
      }
      const top = ctx.fornecedoresBaratos.slice(0, 5);
      return {
        pergunta,
        intencao,
        resposta:
          "Fornecedores com menor preço conhecido:\n" +
          top.map((f) => `• ${f.ingredienteNome}: ${f.fornecedorNome} (${formatarMoeda(f.preco)})`).join("\n"),
        dados: top,
      };
    }
    case "consumo_semana": {
      const top = [...ctx.consumos].sort((a, b) => b.semanal - a.semanal).slice(0, 8);
      const total = top.reduce((s, c) => s + c.semanal, 0);
      return {
        pergunta,
        intencao,
        resposta:
          `Consumo previsto na próxima semana (top itens): total relativo ${round2(total)} un.\n` +
          top.map((c) => `• ${c.nome}: ${c.semanal}`).join("\n"),
        dados: top,
      };
    }
    case "produto_parado": {
      const parados = ctx.giros
        .filter((g) => g.estoqueMedio > 0 && g.velocidadeDiaria <= 0)
        .slice(0, 8);
      if (parados.length === 0) {
        return {
          pergunta,
          intencao,
          resposta: "Nenhum produto parado detectado no período analisado.",
        };
      }
      return {
        pergunta,
        intencao,
        resposta:
          "Produtos sem consumo no período (capital parado):\n" +
          parados.map((g) => `• ${g.nome} (estoque médio ${g.estoqueMedio})`).join("\n"),
        dados: parados,
      };
    }
    case "produto_gira": {
      const top = [...ctx.giros].sort((a, b) => b.giroMensal - a.giroMensal).slice(0, 5);
      return {
        pergunta,
        intencao,
        resposta:
          "Produtos com maior giro mensal:\n" +
          top.map((g) => `• ${g.nome}: giro ${g.giroMensal}×/mês · cobertura ${g.diasCobertura ?? "—"} dias`).join("\n"),
        dados: top,
      };
    }
    case "dinheiro_parado": {
      return {
        pergunta,
        intencao,
        resposta: `Há aproximadamente ${formatarMoeda(ctx.valorParado)} parado em estoque sem giro no período.`,
        dados: { valorParado: ctx.valorParado },
      };
    }
    case "desperdicio": {
      const top = [...ctx.perdasPorProduto].sort((a, b) => b.custo - a.custo).slice(0, 5);
      if (top.length === 0) {
        return {
          pergunta,
          intencao,
          resposta: "Nenhuma perda registrada no período.",
        };
      }
      return {
        pergunta,
        intencao,
        resposta:
          "Produtos que mais geram desperdício (custo):\n" +
          top.map((p) => `• ${p.nome}: ${p.quantidade} un · ${formatarMoeda(p.custo)}`).join("\n"),
        dados: top,
      };
    }
    default:
      return {
        pergunta,
        intencao,
        resposta:
          "Posso ajudar com: o que comprar amanhã, fornecedor mais barato, consumo da semana, produtos parados, maior giro, dinheiro parado em estoque e desperdício.",
      };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
