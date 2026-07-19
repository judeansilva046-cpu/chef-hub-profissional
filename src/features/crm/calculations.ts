import type { ClienteComMetricas } from "@/features/crm-segmentacao/calculations";
import { calcularSegmentosCliente, calcularTicketMedioGeral, calcularLimiarVip } from "@/features/crm-segmentacao/calculations";

export interface IndicadoresDashboardCrm {
  novosClientes: number;
  clientesAtivos: number;
  clientesInativos: number;
  taxaRecompraPercentual: number;
  retencaoPercentual: number;
  churnPercentual: number;
  ticketMedioGeral: number;
  ltvMedio: number;
  frequenciaMediaCompras: number;
}

/**
 * Retenção/churn aqui comparam dois períodos de 30 dias (últimos 30 dias vs
 * os 30 dias anteriores) — a definição mais simples possível que ainda é
 * verificável com os dados que o projeto já tem (sem coorte por mês de
 * aquisição, que exigiria um histórico maior do que este projeto tem hoje).
 * LTV é uma média do total gasto histórico dos clientes com pelo menos 1
 * compra — proxy simples, não um valor presente descontado.
 */
export function calcularIndicadoresDashboardCrm(
  clientes: ClienteComMetricas[],
  vendasPorCliente: Map<string, string[]>,
  hoje: Date = new Date(),
): IndicadoresDashboardCrm {
  const limiarVip = calcularLimiarVip(clientes);
  const ticketMedioGeral = calcularTicketMedioGeral(clientes);
  const contexto = { hoje, limiarVip, ticketMedioGeral };

  let novosClientes = 0;
  let clientesAtivos = 0;
  let clientesInativos = 0;

  for (const cliente of clientes) {
    const segmentos = calcularSegmentosCliente(cliente, contexto);
    if (segmentos.includes("novo")) novosClientes += 1;
    if (segmentos.includes("inativo")) clientesInativos += 1;
    else if (cliente.quantidadeCompras > 0) clientesAtivos += 1;
  }

  const compradores = clientes.filter((cliente) => cliente.quantidadeCompras > 0);
  const recorrentes = compradores.filter((cliente) => cliente.quantidadeCompras >= 2);
  const taxaRecompraPercentual = compradores.length > 0 ? (recorrentes.length / compradores.length) * 100 : 0;

  const em30Dias = new Date(hoje);
  em30Dias.setDate(em30Dias.getDate() - 30);
  const em60Dias = new Date(hoje);
  em60Dias.setDate(em60Dias.getDate() - 60);

  let ativosPeriodoAnterior = 0;
  let retidosNoPeriodoAtual = 0;

  for (const [clienteId, datas] of vendasPorCliente.entries()) {
    const comprouPeriodoAnterior = datas.some((data) => {
      const d = new Date(data);
      return d >= em60Dias && d < em30Dias;
    });
    if (!comprouPeriodoAnterior) continue;

    ativosPeriodoAnterior += 1;
    const comprouPeriodoAtual = datas.some((data) => new Date(data) >= em30Dias);
    if (comprouPeriodoAtual) retidosNoPeriodoAtual += 1;
    void clienteId;
  }

  const retencaoPercentual = ativosPeriodoAnterior > 0 ? (retidosNoPeriodoAtual / ativosPeriodoAnterior) * 100 : 0;
  const churnPercentual = ativosPeriodoAnterior > 0 ? 100 - retencaoPercentual : 0;

  const ltvMedio = compradores.length > 0
    ? compradores.reduce((total, cliente) => total + cliente.totalGasto, 0) / compradores.length
    : 0;

  const frequenciaMediaCompras = compradores.length > 0
    ? compradores.reduce((total, cliente) => total + cliente.quantidadeCompras, 0) / compradores.length
    : 0;

  return {
    novosClientes,
    clientesAtivos,
    clientesInativos,
    taxaRecompraPercentual,
    retencaoPercentual,
    churnPercentual,
    ticketMedioGeral,
    ltvMedio,
    frequenciaMediaCompras,
  };
}
