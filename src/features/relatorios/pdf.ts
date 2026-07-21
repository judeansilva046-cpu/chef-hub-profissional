import PDFDocument from "pdfkit";

export interface GerarPdfRelatorioInput {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
  periodoLabel: string;
}

/**
 * Gera um PDF tabular simples (A4 paisagem quando há muitas colunas).
 * Labels em português; encoding WinAnsi cobre acentuação pt-BR via Helvetica.
 */
export function gerarPdfRelatorio({
  titulo,
  colunas,
  linhas,
  periodoLabel,
}: GerarPdfRelatorioInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const landscape = colunas.length > 5;
    const doc = new PDFDocument({
      size: "A4",
      layout: landscape ? "landscape" : "portrait",
      margin: 40,
      info: {
        Title: titulo,
        Author: "Chef Hub Profissional",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(16).fillColor("#0f172a").text(titulo, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#64748b").text(periodoLabel);
    doc.moveDown(1);

    const colCount = Math.max(colunas.length, 1);
    const colWidth = pageWidth / colCount;
    const rowHeight = 18;
    const startX = doc.page.margins.left;
    let y = doc.y;

    function ensureSpace(needed: number) {
      if (y + needed > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }
    }

    function drawHeader() {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a");
      colunas.forEach((coluna, index) => {
        doc.text(String(coluna), startX + index * colWidth, y, {
          width: colWidth - 4,
          lineBreak: false,
          ellipsis: true,
        });
      });
      y += rowHeight;
      doc
        .moveTo(startX, y - 4)
        .lineTo(startX + pageWidth, y - 4)
        .strokeColor("#cbd5e1")
        .stroke();
    }

    drawHeader();

    doc.font("Helvetica").fontSize(8).fillColor("#334155");
    for (const linha of linhas) {
      ensureSpace(rowHeight);
      linha.forEach((celula, index) => {
        if (index >= colCount) return;
        doc.text(String(celula), startX + index * colWidth, y, {
          width: colWidth - 4,
          lineBreak: false,
          ellipsis: true,
        });
      });
      y += rowHeight;
    }

    if (linhas.length === 0) {
      ensureSpace(rowHeight);
      doc.fillColor("#64748b").text("Nenhum registro no período.", startX, y);
    }

    doc.end();
  });
}
