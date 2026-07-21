export type PedidoPrioridadeInput = {
  id: string;
  tipo: string;
  status: string;
  /** ISO — início da espera (confirmado_em ou criado_em). */
  referenciaEm: string;
  /** Itens ainda não prontos no filtro atual. */
  itensPendentes: number;
};

export type PedidoComPrioridade<T extends PedidoPrioridadeInput> = T & {
  minutosEspera: number;
  scorePrioridade: number;
  atrasado: boolean;
};

/**
 * Priorização automática da fila KDS.
 * Score maior = mais urgente (aparece primeiro).
 *
 * Fatores:
 * - minutos de espera (peso principal)
 * - boost para entrega/retirada
 * - itens pendentes
 * - bônus extra quando ultrapassa o limite de atraso
 */
export function calcularScorePrioridade(
  input: PedidoPrioridadeInput,
  agoraMs: number,
  opts?: {
    alertaAtrasoMinutos?: number;
    prioridadeEntregaBoost?: number;
  },
): { minutosEspera: number; scorePrioridade: number; atrasado: boolean } {
  const alerta = opts?.alertaAtrasoMinutos ?? 15;
  const boostEntrega = opts?.prioridadeEntregaBoost ?? 10;

  const inicio = new Date(input.referenciaEm).getTime();
  const minutosEspera = Math.max(0, Math.floor((agoraMs - inicio) / 60_000));

  let score = minutosEspera * 10;
  score += input.itensPendentes * 3;

  if (input.tipo === "entrega") score += boostEntrega;
  else if (input.tipo === "retirada") score += Math.floor(boostEntrega / 2);

  if (input.status === "confirmado") score += 5;

  const atrasado = minutosEspera >= alerta;
  if (atrasado) score += 50 + (minutosEspera - alerta) * 5;

  return { minutosEspera, scorePrioridade: score, atrasado };
}

export function priorizarFilaKds<T extends PedidoPrioridadeInput>(
  pedidos: T[],
  agoraMs: number = Date.now(),
  opts?: {
    alertaAtrasoMinutos?: number;
    prioridadeEntregaBoost?: number;
  },
): PedidoComPrioridade<T>[] {
  return pedidos
    .map((pedido) => {
      const calc = calcularScorePrioridade(pedido, agoraMs, opts);
      return { ...pedido, ...calc };
    })
    .sort((a, b) => {
      if (b.scorePrioridade !== a.scorePrioridade) {
        return b.scorePrioridade - a.scorePrioridade;
      }
      return a.referenciaEm.localeCompare(b.referenciaEm);
    });
}
