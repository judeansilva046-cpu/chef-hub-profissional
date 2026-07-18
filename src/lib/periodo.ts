/** Primeiro/último dia do mês corrente, em ISO (yyyy-mm-dd) — período padrão do Dashboard e dos Relatórios quando nenhum filtro de data é informado. */
export function primeiroDiaDoMesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ultimoDiaDoMesAtual(): string {
  const hoje = new Date();
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return `${ultimoDia.getFullYear()}-${String(ultimoDia.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia.getDate()).padStart(2, "0")}`;
}
