import type { BiComparativoModo } from "./types";

export type Periodo = { inicio: string; fim: string };

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Período atual + período anterior para comparativos executivos. */
export function resolverComparativo(
  modo: BiComparativoModo,
  ref: Date = new Date(),
): { atual: Periodo; anterior: Periodo; label: string } {
  const hoje = startOfDay(ref);

  if (modo === "hoje_ontem") {
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    return {
      atual: { inicio: isoDate(hoje), fim: isoDate(hoje) },
      anterior: { inicio: isoDate(ontem), fim: isoDate(ontem) },
      label: "Hoje × Ontem",
    };
  }

  if (modo === "semana_semana") {
    const day = hoje.getDay(); // 0=dom
    const diffSegunda = day === 0 ? -6 : 1 - day;
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() + diffSegunda);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    const inicioAnt = new Date(inicioSemana);
    inicioAnt.setDate(inicioSemana.getDate() - 7);
    const fimAnt = new Date(fimSemana);
    fimAnt.setDate(fimSemana.getDate() - 7);
    return {
      atual: { inicio: isoDate(inicioSemana), fim: isoDate(fimSemana) },
      anterior: { inicio: isoDate(inicioAnt), fim: isoDate(fimAnt) },
      label: "Semana × Semana",
    };
  }

  if (modo === "mes_mes") {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const inicioAnt = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimAnt = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    return {
      atual: { inicio: isoDate(inicioMes), fim: isoDate(fimMes) },
      anterior: { inicio: isoDate(inicioAnt), fim: isoDate(fimAnt) },
      label: "Mês × Mês",
    };
  }

  // ano_ano
  const inicioAno = new Date(hoje.getFullYear(), 0, 1);
  const fimAno = new Date(hoje.getFullYear(), 11, 31);
  const inicioAnt = new Date(hoje.getFullYear() - 1, 0, 1);
  const fimAnt = new Date(hoje.getFullYear() - 1, 11, 31);
  return {
    atual: { inicio: isoDate(inicioAno), fim: isoDate(fimAno) },
    anterior: { inicio: isoDate(inicioAnt), fim: isoDate(fimAnt) },
    label: "Ano × Ano",
  };
}

export function deltaPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) {
    if (atual === 0) return 0;
    return null;
  }
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
}
