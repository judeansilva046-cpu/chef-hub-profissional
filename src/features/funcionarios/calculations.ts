import type { CustoMensalInput, CustoMensalResultado } from "./types";

/**
 * Custo mensal = salário bruto + benefícios + encargos.
 * Encargos = salário bruto × (percentualEncargos / 100).
 * O percentual default (36,8%) é uma aproximação BR (INSS+FGTS+provisões).
 */
export function calcularCustoMensal({
  salarioBruto,
  beneficiosMensais,
  percentualEncargos,
}: CustoMensalInput): CustoMensalResultado {
  const encargos = salarioBruto * (percentualEncargos / 100);
  return {
    encargos,
    custoTotalMensal: salarioBruto + beneficiosMensais + encargos,
  };
}

/**
 * Horas mensais médias = carga semanal × 52 / 12.
 * Custo/hora = custo total mensal ÷ horas mensais.
 */
export function calcularCustoHora(
  custoTotalMensal: number,
  cargaHorariaSemanal: number,
): number {
  const horasMensais = (cargaHorariaSemanal * 52) / 12;
  if (horasMensais <= 0) return 0;
  return custoTotalMensal / horasMensais;
}
