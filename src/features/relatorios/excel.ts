import ExcelJS from "exceljs";

/**
 * Serialização XLSX genérica — mesmo contrato de gerarCsv (cabeçalho + linhas), um
 * único gerador reaproveitado por todo relatório financeiro exportável.
 */
export async function gerarExcel(
  nomeAba: string,
  cabecalho: string[],
  linhas: (string | number)[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const planilha = workbook.addWorksheet(nomeAba.slice(0, 31));

  planilha.addRow(cabecalho);
  planilha.getRow(1).font = { bold: true };
  linhas.forEach((linha) => planilha.addRow(linha));

  planilha.columns.forEach((coluna) => {
    let maiorLargura = 10;
    coluna.eachCell?.({ includeEmpty: true }, (cell) => {
      maiorLargura = Math.max(maiorLargura, String(cell.value ?? "").length + 2);
    });
    coluna.width = Math.min(maiorLargura, 40);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
