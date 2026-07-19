/**
 * Segmentos automáticos (item 3 do escopo da Sprint 07) — sempre calculados
 * em cima de crm_clientes_metricas (migration 0045) + clientes, nunca
 * gravados: um cliente pode pertencer a vários segmentos ao mesmo tempo
 * (ex: VIP e Aniversariante na mesma consulta).
 *
 * Limiares (documentados aqui porque não existe outro lugar no projeto que
 * defina "o que é um cliente VIP" — são decisões de produto, não regra de
 * negócio imposta pelo usuário):
 * - Novo: cadastrado nos últimos 30 dias.
 * - Recorrente: 2+ compras e a última foi há no máximo 90 dias.
 * - Inativo: última compra há mais de 90 dias (ou nunca comprou e foi
 *   cadastrado há mais de 90 dias).
 * - VIP: total gasto no top 10% dos clientes com pelo menos 1 compra.
 * - Alto ticket: ticket médio do cliente >= 1,5x o ticket médio geral da
 *   empresa.
 * - Baixa frequência: 2+ compras com intervalo médio entre compras > 45
 *   dias.
 * - Risco de abandono: cliente recorrente cuja última compra já passou do
 *   dobro do intervalo médio entre as compras dele mesmo (comprava a cada X
 *   dias, já se passaram mais de 2x).
 * - Aniversariante: mês/dia de nascimento igual ao mês/dia de referência.
 */
export type ChaveSegmento =
  | "novo"
  | "recorrente"
  | "inativo"
  | "vip"
  | "alto_ticket"
  | "baixa_frequencia"
  | "risco_abandono"
  | "aniversariante";

export const SEGMENTO_LABEL: Record<ChaveSegmento, string> = {
  novo: "Novo",
  recorrente: "Recorrente",
  inativo: "Inativo",
  vip: "VIP",
  alto_ticket: "Alto ticket",
  baixa_frequencia: "Baixa frequência",
  risco_abandono: "Risco de abandono",
  aniversariante: "Aniversariante",
};

export interface ClienteComMetricas {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  segmento: string | null;
  tags: string[];
  ativo: boolean;
  origem: string | null;
  dataNascimento: string | null;
  criadoEm: string;
  totalGasto: number;
  quantidadeCompras: number;
  ticketMedio: number;
  primeiraCompra: string | null;
  ultimaCompra: string | null;
  diasDesdeUltimaCompra: number | null;
}

function diffEmDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function intervaloMedioEntreCompras(cliente: ClienteComMetricas): number | null {
  if (cliente.quantidadeCompras < 2 || !cliente.primeiraCompra || !cliente.ultimaCompra) {
    return null;
  }
  const dias = diffEmDias(new Date(cliente.ultimaCompra), new Date(cliente.primeiraCompra));
  return dias / (cliente.quantidadeCompras - 1);
}

function ehAniversarianteHoje(dataNascimento: string | null, referencia: Date): boolean {
  if (!dataNascimento) return false;
  const nascimento = new Date(dataNascimento);
  return (
    nascimento.getUTCMonth() === referencia.getMonth() &&
    nascimento.getUTCDate() === referencia.getDate()
  );
}

/** Percentil 90 do total gasto, só entre clientes com pelo menos 1 compra — usado para o corte de "VIP". */
export function calcularLimiarVip(clientes: ClienteComMetricas[]): number {
  const valores = clientes
    .filter((cliente) => cliente.quantidadeCompras > 0)
    .map((cliente) => cliente.totalGasto)
    .sort((a, b) => a - b);
  if (valores.length === 0) return Infinity;
  const indice = Math.floor(0.9 * (valores.length - 1));
  return valores[indice];
}

export function calcularTicketMedioGeral(clientes: ClienteComMetricas[]): number {
  const compradores = clientes.filter((cliente) => cliente.quantidadeCompras > 0);
  if (compradores.length === 0) return 0;
  return compradores.reduce((total, cliente) => total + cliente.ticketMedio, 0) / compradores.length;
}

export interface ContextoSegmentacao {
  hoje?: Date;
  limiarVip: number;
  ticketMedioGeral: number;
}

export function calcularSegmentosCliente(
  cliente: ClienteComMetricas,
  contexto: ContextoSegmentacao,
): ChaveSegmento[] {
  const hoje = contexto.hoje ?? new Date();
  const segmentos: ChaveSegmento[] = [];

  const diasDesdeCadastro = diffEmDias(hoje, new Date(cliente.criadoEm));
  if (diasDesdeCadastro <= 30) segmentos.push("novo");

  if (cliente.quantidadeCompras === 0) {
    if (diasDesdeCadastro > 90) segmentos.push("inativo");
  } else if (cliente.diasDesdeUltimaCompra !== null) {
    if (cliente.diasDesdeUltimaCompra > 90) {
      segmentos.push("inativo");
    } else if (cliente.quantidadeCompras >= 2) {
      segmentos.push("recorrente");
    }
  }

  if (cliente.quantidadeCompras > 0 && cliente.totalGasto >= contexto.limiarVip) {
    segmentos.push("vip");
  }

  if (
    cliente.quantidadeCompras > 0 &&
    contexto.ticketMedioGeral > 0 &&
    cliente.ticketMedio >= contexto.ticketMedioGeral * 1.5
  ) {
    segmentos.push("alto_ticket");
  }

  const intervaloMedio = intervaloMedioEntreCompras(cliente);
  if (intervaloMedio !== null) {
    if (intervaloMedio > 45) {
      segmentos.push("baixa_frequencia");
    }
    if (
      cliente.diasDesdeUltimaCompra !== null &&
      cliente.diasDesdeUltimaCompra > intervaloMedio * 2 &&
      cliente.diasDesdeUltimaCompra <= 90
    ) {
      segmentos.push("risco_abandono");
    }
  }

  if (ehAniversarianteHoje(cliente.dataNascimento, hoje)) {
    segmentos.push("aniversariante");
  }

  return segmentos;
}

export interface CriteriosSegmentoPersonalizado {
  gastoMinimo?: number;
  gastoMaximo?: number;
  ticketMedioMinimo?: number;
  frequenciaMinima?: number;
  diasSemComprarMinimo?: number;
  tags?: string[];
  origem?: string;
}

/** Avalia um cliente contra os critérios salvos de um segmento personalizado — todos os critérios informados precisam bater (E lógico), critérios ausentes são ignorados. */
export function avaliarSegmentoPersonalizado(
  cliente: ClienteComMetricas,
  criterios: CriteriosSegmentoPersonalizado,
): boolean {
  if (criterios.gastoMinimo !== undefined && cliente.totalGasto < criterios.gastoMinimo) return false;
  if (criterios.gastoMaximo !== undefined && cliente.totalGasto > criterios.gastoMaximo) return false;
  if (criterios.ticketMedioMinimo !== undefined && cliente.ticketMedio < criterios.ticketMedioMinimo) return false;
  if (criterios.frequenciaMinima !== undefined && cliente.quantidadeCompras < criterios.frequenciaMinima) {
    return false;
  }
  if (criterios.diasSemComprarMinimo !== undefined) {
    if (cliente.diasDesdeUltimaCompra === null || cliente.diasDesdeUltimaCompra < criterios.diasSemComprarMinimo) {
      return false;
    }
  }
  if (criterios.tags && criterios.tags.length > 0) {
    const temAlgumaTag = criterios.tags.some((tag) => cliente.tags.includes(tag));
    if (!temAlgumaTag) return false;
  }
  if (criterios.origem && cliente.origem !== criterios.origem) return false;

  return true;
}
