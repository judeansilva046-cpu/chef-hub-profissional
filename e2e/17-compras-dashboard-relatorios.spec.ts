import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("Compras — dashboard, relatórios e configuração", () => {
  test("dashboard de compras: indicadores renderizam sem erro", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/compras/dashboard");
    await expect(page.getByRole("heading", { name: "Compras", exact: true })).toBeVisible();
    await expect(page.getByText("Total comprado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pendências" })).toBeVisible();
    await expect(page.getByText("Solicitações aguardando decisão")).toBeVisible();

    expect(erros, `Erros JS no Dashboard de Compras:\n${erros.join("\n")}`).toEqual([]);
  });

  test("relatórios de compras: cards de exportação renderizam", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/compras/relatorios");
    await expect(page.getByRole("heading", { name: "Relatórios de compras" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Solicitações de compra" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Exportar Excel" }).first()).toHaveAttribute(
      "href",
      /\/api\/compras\/exportar\/solicitacoes\?formato=xlsx/,
    );
    await expect(page.getByRole("link", { name: "Exportar PDF" }).first()).toHaveAttribute(
      "href",
      /\/api\/compras\/exportar\/solicitacoes\?formato=pdf/,
    );

    expect(erros, `Erros JS em Relatórios de Compras:\n${erros.join("\n")}`).toEqual([]);
  });

  test("fluxo de aprovação: criar e desativar uma faixa de aprovação", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    const nomeFaixa = `Faixa E2E ${Date.now()}`;

    await page.goto("/compras/aprovacao");
    await expect(page.getByRole("heading", { name: "Fluxo de aprovação" })).toBeVisible();

    await page.getByRole("button", { name: "Nova faixa" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nome").fill(nomeFaixa);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(nomeFaixa) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Ativa", { exact: true })).toBeVisible();

    await linha.getByRole("button", { name: "Desativar" }).click();
    await expect(linha.getByText("Inativa", { exact: true })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Fluxo de aprovação:\n${erros.join("\n")}`).toEqual([]);
  });
});
