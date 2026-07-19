import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("CRM — Fidelidade, Cashback e Cupons", () => {
  test("fidelidade: configurar regras e criar nível", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);

    await page.goto("/crm/fidelidade");
    await expect(page.getByRole("heading", { name: "Regras de pontos" })).toBeVisible();

    await page.getByLabel("Programa de fidelidade ativo").check();
    await page.getByLabel("Pontos por R$1,00").fill("2");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Configuração salva.")).toBeVisible({ timeout: 10_000 });

    const nomeNivel = `Nível E2E ${Date.now()}`;
    await page.getByRole("button", { name: "Novo nível" }).click();
    await page.getByLabel("Nome").fill(nomeNivel);
    await page.getByLabel("Pontos mínimos").fill("500");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("row", { name: new RegExp(nomeNivel) })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Fidelidade:\n${erros.join("\n")}`).toEqual([]);
  });

  test("cashback: configurar regras percentuais", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/crm/cashback");
    await expect(page.getByRole("heading", { name: "Regras de cashback" })).toBeVisible();

    await page.getByLabel("Cashback ativo").check();
    await page.getByLabel("Percentual (%)").fill("3");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Configuração salva.")).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Cashback:\n${erros.join("\n")}`).toEqual([]);
  });

  test("cupons: criar cupom percentual e desativar", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const codigo = `E2E${Date.now() % 1000000}`;

    await page.goto("/crm/cupons");
    await expect(page.getByRole("heading", { name: "Cupons" })).toBeVisible();

    await page.getByRole("button", { name: "Novo cupom" }).click();
    await page.getByLabel("Código").fill(codigo);
    await page.getByLabel("Percentual (%)").fill("15");
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(codigo, "i") });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Ativo", { exact: true })).toBeVisible();

    await linha.getByRole("button", { name: "Desativar" }).click();
    await expect(linha.getByText("Inativo", { exact: true })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Cupons:\n${erros.join("\n")}`).toEqual([]);
  });
});
