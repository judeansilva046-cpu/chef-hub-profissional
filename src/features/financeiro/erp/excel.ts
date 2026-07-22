/**
 * SpreadsheetML mínimo (.xls) abrível no Excel — sem dependência xlsx/exceljs.
 */
export function gerarExcelXml(
  titulo: string,
  colunas: string[],
  linhas: (string | number)[][],
): string {
  const escape = (v: string | number) =>
    String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const header = colunas
    .map((c) => `<Cell><Data ss:Type="String">${escape(c)}</Data></Cell>`)
    .join("");
  const rows = linhas
    .map((linha) => {
      const cells = linha
        .map((cell) => {
          const type = typeof cell === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escape(cell)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escape(titulo).slice(0, 31)}">
  <Table>
   <Row>${header}</Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}
