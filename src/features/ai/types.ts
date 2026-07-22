export type ChefHubAiIntent =
  | "lucro_caiu"
  | "fornecedor_preco"
  | "comprar_amanha"
  | "desperdicio"
  | "garcom_sobremesas"
  | "campanha_clientes"
  | "simulacao_preco"
  | "previsao_vendas"
  | "produtos_lucrativos"
  | "cmv_subiu"
  | "clientes_inativos"
  | "unidade_melhor"
  | "desconhecida";

export type ChefHubAiFonte = {
  modulo: string;
  descricao: string;
};

export type ChefHubAiResposta = {
  pergunta: string;
  intencao: ChefHubAiIntent;
  resposta: string;
  /** Como a conclusão foi obtida (transparência). */
  explicacao: string;
  fontes: ChefHubAiFonte[];
  dados?: unknown;
  sugestoes?: string[];
};

export type ChefHubAiContexto = {
  periodoAtual: { inicio: string; fim: string; label: string };
  periodoAnterior: { inicio: string; fim: string; label: string };
  financeiro: {
    receitaAtual: number;
    receitaAnterior: number;
    lucroAtual: number;
    lucroAnterior: number;
    cmvAtual: number;
    cmvAnterior: number;
    margemAtualPct: number | null;
    margemAnteriorPct: number | null;
  };
  produtosLucrativos: Array<{
    id: string;
    nome: string;
    faturamento: number;
    margem: number;
    quantidade: number;
  }>;
  perdas: Array<{ nome: string; quantidade: number; custo: number }>;
  comprasUrgentes: Array<{
    nome: string;
    quantidadeSugerida: number;
    prioridade: string;
    comprarAte: string;
    fornecedorNome?: string | null;
  }>;
  fornecedoresPreco: Array<{
    fornecedorNome: string;
    ingredienteNome: string;
    precoAtual: number;
    precoAnterior: number | null;
    variacaoPct: number | null;
  }>;
  garcomSobremesas: Array<{
    garcomNome: string;
    quantidade: number;
    faturamento: number;
  }>;
  campanhas: Array<{
    nome: string;
    status: string;
    channel: string;
    enviados: number;
    convertidos: number;
    receita: number;
  }>;
  clientesInativos: Array<{ nome: string; dias: number; totalGasto: number }>;
  receitaPorCanal: Array<{ nome: string; receita: number; qtd: number }>;
  fichas: Array<{
    id: string;
    nome: string;
    custoPorPorcao: number;
    preco: number;
    margemPct: number | null;
  }>;
  custosVariaveis: { percentualTotal: number; fixoTotal: number };
};
