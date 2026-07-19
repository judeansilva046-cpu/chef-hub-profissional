import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("CRM — Segmentação, Funil comercial e Tarefas", () => {
  test("segmentação: cards automáticos e segmento personalizado", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);

    await page.goto("/crm/segmentacao");
    await expect(page.getByRole("heading", { name: "CRM" })).toBeVisible();

    await expect(page.getByText("Novo", { exact: true })).toBeVisible();
    await expect(page.getByText("VIP", { exact: true })).toBeVisible();
    await expect(page.getByText("Aniversariante", { exact: true })).toBeVisible();
    await expect(page.getByText("Risco de abandono", { exact: true })).toBeVisible();

    const nomeSegmento = `Segmento E2E ${Date.now()}`;
    await page.getByRole("button", { name: "Novo segmento personalizado" }).click();
    await page.getByLabel("Nome").fill(nomeSegmento);
    await page.getByLabel("Gasto total mínimo (opcional)").fill("50");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("link", { name: nomeSegmento })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Segmentação:\n${erros.join("\n")}`).toEqual([]);
  });

  test("funil comercial: criar lead, ver no Kanban e converter em cliente", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nomeLead = `Lead E2E ${Date.now()}`;

    await page.goto("/crm/funil");
    await expect(page.getByRole("heading", { name: "Funil comercial" })).toBeVisible();

    await page.getByRole("button", { name: "Novo lead" }).click();
    await page.getByLabel("Nome").fill(nomeLead);
    await page.getByLabel("Valor estimado (R$)").fill("500");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText(nomeLead)).toBeVisible({ timeout: 10_000 });

    const cartaoLead = page.locator("div.border-border.bg-card.rounded-lg.border.p-3", {
      has: page.getByText(nomeLead, { exact: true }),
    });
    const dialogPromise = page.waitForEvent("dialog");
    await cartaoLead.getByRole("button", { name: "Converter" }).click();
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain("convertido");
    await dialog.accept();

    // Lead convertido sai da lista de leads abertos (listarLeadsAbertos
    // filtra status<>'convertido') — a conversão é confirmada vendo o novo
    // cliente em /clientes, não pelo card (que desaparece do Kanban).
    await page.goto("/clientes");
    await expect(page.getByRole("row", { name: new RegExp(nomeLead) })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS no Funil comercial:\n${erros.join("\n")}`).toEqual([]);
  });

  test("tarefas: criar e mudar status", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const titulo = `Tarefa E2E ${Date.now()}`;

    await page.goto("/crm/tarefas");
    await expect(page.getByRole("heading", { name: "Tarefas e follow-up" })).toBeVisible();

    await page.getByRole("button", { name: "Nova tarefa" }).click();
    await page.getByLabel("Título").fill(titulo);
    await page.getByLabel("Prioridade").selectOption("alta");
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(titulo) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Alta", { exact: true })).toBeVisible();

    await linha.getByRole("combobox").selectOption("concluida");
    await expect(linha.getByRole("combobox")).toHaveValue("concluida", { timeout: 10_000 });

    expect(erros, `Erros JS em Tarefas:\n${erros.join("\n")}`).toEqual([]);
  });
});
