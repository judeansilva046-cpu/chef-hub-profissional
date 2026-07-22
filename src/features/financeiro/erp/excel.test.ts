import { describe, expect, it } from "vitest";

import { gerarExcelXml } from "./excel";

describe("export excel", () => {
  it("gera SpreadsheetML com colunas e linhas", () => {
    const xml = gerarExcelXml("DRE", ["Linha", "Valor"], [["Receita", 100]]);
    expect(xml).toContain("Workbook");
    expect(xml).toContain("Receita");
    expect(xml).toContain("100");
    expect(xml).toContain("ss:Type=\"Number\"");
  });
});
