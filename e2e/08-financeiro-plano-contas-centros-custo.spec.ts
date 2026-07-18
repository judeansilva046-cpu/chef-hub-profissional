import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("Financeiro — Plano de Contas e Centros de Custo", () => {
  test("plano de contas: seed padrão visível e criação de conta nova", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/financeiro/plano-de-contas");
    await expect(page.getByRole("heading", { name: "Plano de contas" })).toBeVisible();

    // Seed da migration 0040 / criarEmpresa deve estar visível.
    await expect(page.getByText("Receitas", { exact: true })).toBeVisible();
    await expect(page.getByText("CMV - Custo da Mercadoria Vendida")).toBeVisible();

    const codigo = `TESTE-${Date.now()}`;
    await page.getByRole("button", { name: "Nova conta" }).click();
    await page.getByLabel("Código").fill(codigo);
    await page.getByLabel("Nome").fill("Conta de teste E2E");
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(codigo) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Conta de teste E2E")).toBeVisible();

    expect(erros, `Erros JS em Plano de Contas:\n${erros.join("\n")}`).toEqual([]);
  });

  test("centros de custo: seed padrão visível e criação de centro novo", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/financeiro/centros-de-custo");
    await expect(page.getByRole("heading", { name: "Centros de custo" })).toBeVisible();

    await expect(page.getByText("Cozinha", { exact: true })).toBeVisible();
    await expect(page.getByText("Delivery", { exact: true })).toBeVisible();

    const codigo = `TST${Date.now() % 100000}`;
    await page.getByRole("button", { name: "Novo centro de custo" }).click();
    await page.getByLabel("Código").fill(codigo);
    await page.getByLabel("Nome").fill("Centro de teste E2E");
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(codigo) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Centro de teste E2E")).toBeVisible();

    expect(erros, `Erros JS em Centros de Custo:\n${erros.join("\n")}`).toEqual([]);
  });
});
