/** Regras puras de fidelidade, cashback, cupons e segmentação CRM. */

export interface LoyaltyProgramRules {
  pointsPerCurrency: number;
  currencyPerPoint: number;
  cashbackPercent: number;
  pointsValidityDays: number;
  minRedeemPoints: number;
  welcomePoints: number;
}

export interface ClienteMetricas {
  clienteId: string;
  nome: string;
  totalGasto: number;
  quantidadeCompras: number;
  ticketMedio: number;
  diasDesdeUltimaCompra: number | null;
  diasDesdeCadastro: number;
  ativo: boolean;
}

export type SegmentKey =
  | "vip"
  | "novos"
  | "inativos"
  | "alto_ticket"
  | "baixo_ticket"
  | "frequentes"
  | "pouco_frequentes";

export function calcularPontosAcumulo(
  valorCompra: number,
  pointsPerCurrency: number,
): number {
  if (valorCompra <= 0 || pointsPerCurrency <= 0) return 0;
  return round2(valorCompra * pointsPerCurrency);
}

export function calcularValorResgate(
  points: number,
  currencyPerPoint: number,
): number {
  if (points <= 0 || currencyPerPoint <= 0) return 0;
  return round2(points * currencyPerPoint);
}

export function podeResgatarPontos(
  saldo: number,
  pointsToRedeem: number,
  minRedeemPoints: number,
): { ok: boolean; motivo?: string } {
  if (pointsToRedeem <= 0) return { ok: false, motivo: "Informe pontos a resgatar." };
  if (pointsToRedeem < minRedeemPoints) {
    return { ok: false, motivo: `Mínimo de ${minRedeemPoints} pontos.` };
  }
  if (pointsToRedeem > saldo) {
    return { ok: false, motivo: "Saldo insuficiente." };
  }
  return { ok: true };
}

export function calcularCashback(valorCompra: number, cashbackPercent: number): number {
  if (valorCompra <= 0 || cashbackPercent <= 0) return 0;
  return round2((valorCompra * cashbackPercent) / 100);
}

export function aplicarSaldo(
  saldoAtual: number,
  delta: number,
  tipo: "credito" | "debito",
): number {
  const next = tipo === "credito" ? saldoAtual + delta : saldoAtual - delta;
  return round2(Math.max(0, next));
}

export function dataExpiracaoPontos(
  fromIso: string,
  validityDays: number,
): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + Math.max(1, validityDays));
  return d.toISOString();
}

export type CupomTipo =
  | "percentual"
  | "valor_fixo"
  | "frete_gratis"
  | "brinde"
  | "combo"
  | "primeira_compra"
  | "aniversario"
  | "inatividade";

export interface CupomInput {
  tipo: CupomTipo;
  discountPercent?: number | null;
  discountAmount?: number | null;
  minOrderAmount?: number;
  maxUses?: number | null;
  usesCount?: number;
  maxUsesPerCustomer?: number;
  customerUses?: number;
  startsAt: string;
  endsAt?: string | null;
  active: boolean;
  primeiraCompra?: boolean;
  isAniversario?: boolean;
  diasInativo?: number | null;
  limiarInatividadeDias?: number;
}

export function validarCupom(
  cupom: CupomInput,
  orderAmount: number,
  agoraIso: string = new Date().toISOString(),
): { ok: boolean; motivo?: string; desconto: number } {
  if (!cupom.active) return { ok: false, motivo: "Cupom inativo.", desconto: 0 };
  if (agoraIso < cupom.startsAt) {
    return { ok: false, motivo: "Cupom ainda não iniciado.", desconto: 0 };
  }
  if (cupom.endsAt && agoraIso > cupom.endsAt) {
    return { ok: false, motivo: "Cupom expirado.", desconto: 0 };
  }
  if (cupom.maxUses != null && (cupom.usesCount ?? 0) >= cupom.maxUses) {
    return { ok: false, motivo: "Limite global de uso atingido.", desconto: 0 };
  }
  if (
    cupom.maxUsesPerCustomer != null &&
    (cupom.customerUses ?? 0) >= cupom.maxUsesPerCustomer
  ) {
    return { ok: false, motivo: "Limite por cliente atingido.", desconto: 0 };
  }
  if (orderAmount < (cupom.minOrderAmount ?? 0)) {
    return { ok: false, motivo: "Pedido abaixo do valor mínimo.", desconto: 0 };
  }

  if (cupom.tipo === "primeira_compra" && !cupom.primeiraCompra) {
    return { ok: false, motivo: "Válido apenas na primeira compra.", desconto: 0 };
  }
  if (cupom.tipo === "aniversario" && !cupom.isAniversario) {
    return { ok: false, motivo: "Válido apenas no aniversário.", desconto: 0 };
  }
  if (cupom.tipo === "inatividade") {
    const limiar = cupom.limiarInatividadeDias ?? 45;
    if ((cupom.diasInativo ?? 0) < limiar) {
      return { ok: false, motivo: "Cliente ainda não está inativo o suficiente.", desconto: 0 };
    }
  }

  const desconto = calcularDescontoCupom(cupom, orderAmount);
  return { ok: true, desconto };
}

export function calcularDescontoCupom(cupom: CupomInput, orderAmount: number): number {
  if (cupom.tipo === "percentual" || cupom.tipo === "primeira_compra" || cupom.tipo === "aniversario" || cupom.tipo === "inatividade") {
    const pct = cupom.discountPercent ?? 0;
    if (pct > 0) return round2(Math.min(orderAmount, (orderAmount * pct) / 100));
  }
  if (cupom.tipo === "valor_fixo" || cupom.tipo === "combo") {
    return round2(Math.min(orderAmount, cupom.discountAmount ?? 0));
  }
  if (cupom.tipo === "frete_gratis") {
    return round2(cupom.discountAmount ?? 0);
  }
  if (cupom.tipo === "brinde") return 0;
  return 0;
}

export function segmentarClientes(
  clientes: ClienteMetricas[],
  opts?: {
    vipTicketMin?: number;
    vipComprasMin?: number;
    altoTicketMin?: number;
    baixoTicketMax?: number;
    frequentesMin?: number;
    poucoFrequentesMax?: number;
    inativosDias?: number;
    novosDias?: number;
  },
): Record<SegmentKey, string[]> {
  const vipTicket = opts?.vipTicketMin ?? 80;
  const vipCompras = opts?.vipComprasMin ?? 5;
  const alto = opts?.altoTicketMin ?? 60;
  const baixo = opts?.baixoTicketMax ?? 30;
  const freqMin = opts?.frequentesMin ?? 4;
  const poucoMax = opts?.poucoFrequentesMax ?? 1;
  const inativosDias = opts?.inativosDias ?? 45;
  const novosDias = opts?.novosDias ?? 30;

  const result: Record<SegmentKey, string[]> = {
    vip: [],
    novos: [],
    inativos: [],
    alto_ticket: [],
    baixo_ticket: [],
    frequentes: [],
    pouco_frequentes: [],
  };

  for (const c of clientes) {
    if (!c.ativo) continue;

    if (c.ticketMedio >= vipTicket && c.quantidadeCompras >= vipCompras) {
      result.vip.push(c.clienteId);
    }
    if (c.diasDesdeCadastro <= novosDias || c.quantidadeCompras <= 1) {
      result.novos.push(c.clienteId);
    }
    if (
      c.diasDesdeUltimaCompra == null ||
      c.diasDesdeUltimaCompra >= inativosDias
    ) {
      result.inativos.push(c.clienteId);
    }
    if (c.ticketMedio >= alto && c.quantidadeCompras > 0) {
      result.alto_ticket.push(c.clienteId);
    }
    if (c.quantidadeCompras > 0 && c.ticketMedio > 0 && c.ticketMedio <= baixo) {
      result.baixo_ticket.push(c.clienteId);
    }
    if (c.quantidadeCompras >= freqMin) {
      result.frequentes.push(c.clienteId);
    }
    if (c.quantidadeCompras > 0 && c.quantidadeCompras <= poucoMax) {
      result.pouco_frequentes.push(c.clienteId);
    }
  }

  return result;
}

export function calcularDashboardCrm(input: {
  totalClientes: number;
  novosClientes: number;
  ativos: number;
  inativos: number;
  ticketMedio: number;
  frequenciaMedia: number;
  taxaRetorno: number;
  cuponsUsados: number;
  pontosEmitidos: number;
  pontosResgatados: number;
  cashbackConcedido: number;
}) {
  return {
    ...input,
    taxaAtivos:
      input.totalClientes > 0
        ? round2((input.ativos / input.totalClientes) * 100)
        : 0,
  };
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
