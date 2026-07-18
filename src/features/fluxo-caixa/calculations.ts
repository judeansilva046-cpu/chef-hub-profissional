/**
 * Fluxo de Caixa = REALIZADO (caixa_movimentacoes, Sprint 05 — dinheiro que
 * já entrou/saiu de verdade) + PROJETADO (contas_pagar/contas_receber_
 * parcelas pendentes, Sprint 06 — o que ainda vai entrar/sair). Não
 * recalcula nada que já existe: só agrupa por mês o que as duas fontes já
 * fornecem prontas.
 */
export interface MovimentacaoRealizada {
  tipo: string;
  valor: number;
  criado_em: string;
}

export interface ParcelaProjetada {
  valor: number;
  data_vencimento: string;
}

export interface FluxoCaixaMes {
  mes: string;
  entradasRealizadas: number;
  saidasRealizadas: number;
  saldoRealizado: number;
  entradasProjetadas: number;
  saidasProjetadas: number;
  saldoProjetado: number;
}

const TIPOS_ENTRADA = new Set(["entrada", "suprimento", "venda"]);

export function calcularFluxoCaixaPorMes(
  movimentacoesRealizadas: MovimentacaoRealizada[],
  contasReceberPendentes: ParcelaProjetada[],
  contasPagarPendentes: ParcelaProjetada[],
): FluxoCaixaMes[] {
  const porMes = new Map<string, FluxoCaixaMes>();

  function obterMes(mes: string): FluxoCaixaMes {
    const existente = porMes.get(mes);
    if (existente) return existente;
    const novo: FluxoCaixaMes = {
      mes,
      entradasRealizadas: 0,
      saidasRealizadas: 0,
      saldoRealizado: 0,
      entradasProjetadas: 0,
      saidasProjetadas: 0,
      saldoProjetado: 0,
    };
    porMes.set(mes, novo);
    return novo;
  }

  for (const mov of movimentacoesRealizadas) {
    const mes = mov.criado_em.slice(0, 7);
    const linha = obterMes(mes);
    if (TIPOS_ENTRADA.has(mov.tipo)) {
      linha.entradasRealizadas += mov.valor;
    } else {
      linha.saidasRealizadas += mov.valor;
    }
    linha.saldoRealizado = linha.entradasRealizadas - linha.saidasRealizadas;
  }

  for (const parcela of contasReceberPendentes) {
    const mes = parcela.data_vencimento.slice(0, 7);
    const linha = obterMes(mes);
    linha.entradasProjetadas += parcela.valor;
    linha.saldoProjetado = linha.entradasProjetadas - linha.saidasProjetadas;
  }

  for (const conta of contasPagarPendentes) {
    const mes = conta.data_vencimento.slice(0, 7);
    const linha = obterMes(mes);
    linha.saidasProjetadas += conta.valor;
    linha.saldoProjetado = linha.entradasProjetadas - linha.saidasProjetadas;
  }

  return Array.from(porMes.values()).sort((a, b) => a.mes.localeCompare(b.mes));
}
