import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("CRM — Comunicação, Campanhas e Dashboard", () => {
  test("comunicação: criar template de mensagem", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nomeTemplate = `Template E2E ${Date.now()}`;

    await page.goto("/crm/comunicacao");
    await expect(page.getByRole("heading", { name: "Templates de mensagem" })).toBeVisible();

    await page.getByRole("button", { name: "Novo template" }).click();
    await page.getByLabel("Nome").fill(nomeTemplate);
    await page.getByLabel("Conteúdo").fill("Olá {{nome}}, tudo bem?");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("row", { name: new RegExp(nomeTemplate) })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Comunicação:\n${erros.join("\n")}`).toEqual([]);
  });

  test("campanhas: criar campanha automática vinculada ao template", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nomeCampanha = `Campanha E2E ${Date.now()}`;

    await page.goto("/crm/campanhas");
    await expect(page.getByRole("heading", { name: "Campanhas automáticas" })).toBeVisible();

    await page.getByRole("button", { name: "Nova campanha" }).click();
    await page.getByLabel("Nome").fill(nomeCampanha);
    await page.getByLabel("Gatilho").selectOption("aniversario");
    const selectTemplate = page.getByLabel("Template");
    await selectTemplate.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("row", { name: new RegExp(nomeCampanha) })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Campanhas:\n${erros.join("\n")}`).toEqual([]);
  });

  test("dashboard CRM: indicadores renderizam sem erro", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/crm/dashboard");
    await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
    await expect(page.getByText("Novos clientes (30d)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Funil comercial" })).toBeVisible();
    await expect(page.getByText("Leads abertos")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fidelidade, cashback e cupons" })).toBeVisible();
    await expect(page.getByText("Pontos emitidos")).toBeVisible();

    expect(erros, `Erros JS no Dashboard CRM:\n${erros.join("\n")}`).toEqual([]);
  });
});
