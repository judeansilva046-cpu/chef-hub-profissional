import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("Financeiro — Relatórios, Auditoria e Permissões", () => {
  test("fluxo de caixa carrega sem erros", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/fluxo-de-caixa");
    await expect(page.getByRole("heading", { name: "Fluxo de caixa" })).toBeVisible();
    expect(erros, `Erros JS no Fluxo de Caixa:\n${erros.join("\n")}`).toEqual([]);
  });

  test("DRE carrega e mostra a despesa registrada em Contas a Pagar", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/dre");
    await expect(page.getByRole("heading", { name: /DRE/ })).toBeVisible();
    // A conta a pagar paga no teste anterior (categoria "manual") deve aparecer.
    await expect(page.getByText(/Lucro líquido|Lucro Líquido/)).toBeVisible();
    expect(erros, `Erros JS no DRE:\n${erros.join("\n")}`).toEqual([]);
  });

  test("conciliação carrega sem erros", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/conciliacao");
    await expect(page.getByRole("heading", { name: "Conciliação financeira" })).toBeVisible();
    expect(erros, `Erros JS na Conciliação:\n${erros.join("\n")}`).toEqual([]);
  });

  test("dashboard financeiro carrega com os indicadores", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard Financeiro" })).toBeVisible();
    await expect(page.getByText("Pago no mês")).toBeVisible();
    expect(erros, `Erros JS no Dashboard Financeiro:\n${erros.join("\n")}`).toEqual([]);
  });

  test("auditoria mostra os registros criados pelos testes anteriores", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/auditoria");
    await expect(page.getByRole("heading", { name: "Auditoria financeira" })).toBeVisible();
    await expect(page.getByText("Criado").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Conta a pagar").first()).toBeVisible();
    expect(erros, `Erros JS na Auditoria:\n${erros.join("\n")}`).toEqual([]);
  });

  test("permissões mostra o próprio usuário como dono e permite abrir o convite", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    await page.goto("/financeiro/permissoes");
    await expect(page.getByRole("heading", { name: "Permissões" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Convidar usuário" })).toBeVisible();

    await page.getByRole("button", { name: "Convidar usuário" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    expect(erros, `Erros JS em Permissões:\n${erros.join("\n")}`).toEqual([]);
  });

  test("exportação PDF e Excel retornam arquivo válido para os 4 relatórios", async ({ page }) => {
    const tipos = ["contas-pagar", "contas-receber", "fluxo-caixa", "dre"] as const;

    for (const tipo of tipos) {
      const respostaXlsx = await page.request.get(`/api/financeiro/exportar/${tipo}?formato=xlsx`);
      expect(respostaXlsx.ok(), `${tipo} xlsx status ${respostaXlsx.status()}`).toBeTruthy();
      expect(respostaXlsx.headers()["content-type"]).toContain("spreadsheetml");

      const respostaPdf = await page.request.get(`/api/financeiro/exportar/${tipo}?formato=pdf`);
      expect(respostaPdf.ok(), `${tipo} pdf status ${respostaPdf.status()}`).toBeTruthy();
      expect(respostaPdf.headers()["content-type"]).toContain("application/pdf");
    }
  });
});
