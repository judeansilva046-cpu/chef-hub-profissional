const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});
const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Datas "date-only" (ex: data_validade) não têm componente de hora — new
 * Date(string) as interpretaria como UTC meia-noite, deslocando um dia para
 * trás em fusos negativos (Brasil). Construímos a partir dos componentes
 * locais para evitar esse deslocamento. */
function parseData(valor: string | Date): Date {
  if (valor instanceof Date) return valor;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(valor);
}

export function formatarMoeda(valor: number): string {
  return currencyFormatter.format(valor);
}

export function formatarDecimal(valor: number): string {
  return decimalFormatter.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${percentFormatter.format(valor)}%`;
}

export function formatarData(valor: string | Date): string {
  return dateFormatter.format(parseData(valor));
}

export function formatarDataHora(valor: string | Date): string {
  return dateTimeFormatter.format(parseData(valor));
}

export function formatarMesAno(valor: string | Date): string {
  const formatado = monthYearFormatter.format(parseData(valor));
  return formatado.charAt(0).toUpperCase() + formatado.slice(1);
}
