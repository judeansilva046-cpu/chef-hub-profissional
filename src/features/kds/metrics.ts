export type ItemTempoInput = {
  preparo_iniciado_em: string | null;
  pronto_em: string | null;
};

export type PedidoTempoInput = {
  confirmado_em: string | null;
  criado_em: string;
  /** Quando o pedido ficou pronto (derivado do max pronto_em dos itens ou status). */
  prontoEm?: string | null;
  pedido_itens: ItemTempoInput[];
};

/** Segundos entre duas datas ISO; null se inválido. */
export function segundosEntre(inicio: string | null | undefined, fim: string | null | undefined): number | null {
  if (!inicio || !fim) return null;
  const a = new Date(inicio).getTime();
  const b = new Date(fim).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.floor((b - a) / 1000);
}

export function formatarDuracao(segundos: number | null | undefined): string {
  if (segundos == null || segundos < 0) return "—";
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm.toString().padStart(2, "0")}m`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Tempo decorrido do pedido até agora (a partir de confirmado_em/criado_em). */
export function tempoPedidoSegundos(
  pedido: Pick<PedidoTempoInput, "confirmado_em" | "criado_em">,
  agoraMs: number,
): number {
  const ref = pedido.confirmado_em ?? pedido.criado_em;
  return Math.max(0, Math.floor((agoraMs - new Date(ref).getTime()) / 1000));
}

/** Tempo de preparo do item (iniciado → pronto ou agora). */
export function tempoItemSegundos(item: ItemTempoInput, agoraMs: number): number | null {
  if (!item.preparo_iniciado_em) return null;
  const fim = item.pronto_em ? new Date(item.pronto_em).getTime() : agoraMs;
  const ini = new Date(item.preparo_iniciado_em).getTime();
  if (Number.isNaN(ini) || Number.isNaN(fim) || fim < ini) return null;
  return Math.floor((fim - ini) / 1000);
}

export function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}

/**
 * Tempo médio de preparo por item (itens com pronto_em) e tempo médio
 * de ciclo do pedido (confirmado → último item pronto).
 */
export function calcularTemposMedios(pedidos: PedidoTempoInput[]): {
  tempoMedioItemSegundos: number | null;
  tempoMedioPedidoSegundos: number | null;
  itensAmostrados: number;
  pedidosAmostrados: number;
} {
  const temposItem: number[] = [];
  const temposPedido: number[] = [];

  for (const pedido of pedidos) {
    for (const item of pedido.pedido_itens) {
      const s = segundosEntre(item.preparo_iniciado_em, item.pronto_em);
      if (s != null) temposItem.push(s);
    }

    const prontos = pedido.pedido_itens
      .map((i) => i.pronto_em)
      .filter((v): v is string => Boolean(v));
    const fimPedido = pedido.prontoEm ?? (prontos.length > 0 ? prontos.sort().at(-1)! : null);
    const inicio = pedido.confirmado_em ?? pedido.criado_em;
    const ciclo = segundosEntre(inicio, fimPedido);
    if (ciclo != null) temposPedido.push(ciclo);
  }

  return {
    tempoMedioItemSegundos: media(temposItem),
    tempoMedioPedidoSegundos: media(temposPedido),
    itensAmostrados: temposItem.length,
    pedidosAmostrados: temposPedido.length,
  };
}
