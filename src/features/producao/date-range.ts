function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function adicionarDias(iso: string, dias: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + dias);
  return toIsoDate(date);
}

export function hojeIso(): string {
  return toIsoDate(new Date());
}

/** Semana de segunda a domingo que contém a data âncora. */
export function getSemanaRange(anchorIso: string): {
  inicio: string;
  fim: string;
} {
  const anchor = parseIsoDate(anchorIso);
  const diaSemana = anchor.getDay();
  const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(anchor);
  segunda.setDate(anchor.getDate() + diffParaSegunda);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);

  return { inicio: toIsoDate(segunda), fim: toIsoDate(domingo) };
}
