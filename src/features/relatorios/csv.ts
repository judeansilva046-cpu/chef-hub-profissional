/**
 * Serialização CSV pura (sem libs externas). Cada relatório monta seu
 * próprio cabeçalho + linhas e chama esta função — nenhum relatório
 * reimplementa a fuga de aspas/separador.
 */
function escaparCampo(valor: string | number): string {
  const texto = String(valor);
  if (/[";\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function gerarCsv(cabecalho: string[], linhas: (string | number)[][]): string {
  const todasAsLinhas = [cabecalho, ...linhas];
  // ';' como separador (padrão do Excel em pt-BR) — vírgula é o separador
  // decimal usado em formatarMoeda/formatarDecimal em todo o resto do app.
  return todasAsLinhas.map((linha) => linha.map(escaparCampo).join(";")).join("\r\n");
}
