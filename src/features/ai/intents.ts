import type { ChefHubAiIntent } from "./types";

/** Normaliza PT-BR para matching (remove acentos). */
export function normalizarPergunta(pergunta: string): string {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[?!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extrai percentual de aumento (ex.: "5%", "em 5 por cento"). */
export function extrairPercentual(pergunta: string): number | null {
  const q = normalizarPergunta(pergunta);
  const m =
    q.match(/(\d+(?:[.,]\d+)?)\s*%/) ??
    q.match(/(\d+(?:[.,]\d+)?)\s*por\s*cento/) ??
    q.match(/aument(?:ar|e|o)?\s+(?:o\s+)?preco.*?(\d+(?:[.,]\d+)?)/);
  if (!m?.[1]) return null;
  return Number(m[1].replace(",", "."));
}

/** Extrai nome de prato após "prato" / "deste" / aspas. */
export function extrairNomePrato(pergunta: string): string | null {
  const quoted = pergunta.match(/["“']([^"”']+)["”']/);
  if (quoted?.[1]) return quoted[1].trim();
  const m = pergunta.match(
    /(?:prato|produto|item|ficha)\s+(?:deste\s+|desta\s+|do\s+|da\s+)?(.+?)(?:\s+em\s+\d|\s+em\s+\d|\?|$)/i,
  );
  if (m?.[1]) {
    const nome = m[1].replace(/\s+em\s+\d+.*/i, "").trim();
    if (nome.length >= 2) return nome;
  }
  return null;
}

export function detectarIntencao(pergunta: string): ChefHubAiIntent {
  const q = normalizarPergunta(pergunta);

  if (
    /(lucro|margem).*(caiu|cai|queda|pior|baix)|por que.*(lucro|margem)|porque.*(lucro|margem)/.test(
      q,
    )
  ) {
    return "lucro_caiu";
  }
  if (
    /fornecedor.*(aument|subiu|caro|preco)|preco.*(fornecedor|insumo).*aument|quem.*(aumentou|subiu).*preco/.test(
      q,
    )
  ) {
    return "fornecedor_preco";
  }
  if (
    /(comprar|compra).*(amanha|hoje|agora)|quanto devo comprar|o que preciso comprar|sugestao de compra/.test(
      q,
    )
  ) {
    return "comprar_amanha";
  }
  if (/desperd|perda|quebra|vencimento/.test(q)) {
    return "desperdicio";
  }
  if (
    /garcom.*(sobremesa|vende)|sobremesa.*(garcom|vende)|quem vende mais sobremesa/.test(
      q,
    )
  ) {
    return "garcom_sobremesas";
  }
  if (
    /campanha.*(cliente|trouxe|converte|melhor)|qual campanha|marketing.*(melhor|cliente)/.test(
      q,
    )
  ) {
    return "campanha_clientes";
  }
  if (
    /aument.*(preco|preço)|preco.*(\d+\s*%|por cento)|simul|e se eu.*(preco|margem)|quanto muda.*(margem|lucro)/.test(
      q,
    ) ||
    extrairPercentual(pergunta) != null
  ) {
    // Prefer simulation when % + preço/margem context
    if (
      /preco|margem|prato|produto|ficha|simul/.test(q) ||
      extrairPercentual(pergunta) != null
    ) {
      if (/cmv/.test(q) && !/preco|margem|prato/.test(q)) {
        /* fall through */
      } else if (
        /preco|margem|prato|produto|ficha|simul|aument/.test(q)
      ) {
        return "simulacao_preco";
      }
    }
  }
  if (
    /quanto.*(vender|venda)|previsao.*venda|vou vender|vendas.*(semana|mes)/.test(
      q,
    )
  ) {
    return "previsao_vendas";
  }
  if (
    /produto.*(lucr|margem)|mais lucr|quais produtos.*lucr|melhor margem/.test(q)
  ) {
    return "produtos_lucrativos";
  }
  if (/cmv.*(aument|subiu|alto|por que|porque)|por que.*cmv/.test(q)) {
    return "cmv_subiu";
  }
  if (
    /cliente.*(inativ|nao volta|nao voltam|60 dias|churn)|nao voltam/.test(q)
  ) {
    return "clientes_inativos";
  }
  if (
    /unidade.*(melhor|perform)|canal.*(melhor|mais)|qual (unidade|canal).*melhor/.test(
      q,
    )
  ) {
    return "unidade_melhor";
  }

  // Second pass for price simulation without early false negatives
  if (
    extrairPercentual(pergunta) != null &&
    /preco|margem|prato|produto/.test(q)
  ) {
    return "simulacao_preco";
  }

  return "desconhecida";
}

export const SUGESTOES_CHEFHUB_AI = [
  "Por que meu lucro caiu esta semana?",
  "Qual fornecedor aumentou mais os preços?",
  "Quanto devo comprar amanhã?",
  "Quais produtos estão gerando desperdício?",
  "Qual garçom vende mais sobremesas?",
  "Qual campanha trouxe mais clientes?",
  'Se eu aumentar o preço deste prato "Burger" em 5%, quanto muda minha margem?',
  "Quais produtos mais lucram?",
  "O CMV aumentou por quê?",
  "Quais clientes não voltam há 60 dias?",
  "Qual canal performou melhor este mês?",
  "Quanto vou vender esta semana?",
] as const;
