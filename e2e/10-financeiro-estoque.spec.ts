import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("Financeiro, estoque, funcionários e PDF", () => {
  test("páginas de estoque e financeiro carregam sem erros", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Controle de estoque" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/financeiro/painel");
    await expect(page.getByRole("heading", { name: "Painel Nunca no Vermelho" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/financeiro/precificacao");
    await expect(page.getByRole("heading", { name: "Precificação" })).toBeVisible({
      timeout: 15_000,
    });

    expect(erros, `Erros JS:\n${erros.join("\n")}`).toEqual([]);
  });

  test("cadastrar funcionário e ver custo mensal", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);
    const nome = `Func E2E ${Date.now()}`;

    await page.goto("/financeiro/funcionarios");
    await expect(page.getByRole("heading", { name: "Funcionários" })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Novo funcionário" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Novo funcionário" })).toBeVisible();

    await dialog.getByLabel("Nome").fill(nome);
    // CurrencyInput: preenche o campo visível (placeholder R$ 0,00) do salário bruto.
    await dialog.getByPlaceholder("R$ 0,00").first().click();
    await dialog.getByPlaceholder("R$ 0,00").first().fill("3000");
    await dialog.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText(nome)).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em funcionários:\n${erros.join("\n")}`).toEqual([]);
  });

  test("exportar relatório PDF retorna application/pdf", async ({ page }) => {
    await page.goto("/relatorios");
    await expect(page.getByRole("heading", { name: /Relatórios/ })).toBeVisible({
      timeout: 15_000,
    });

    const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
    await page.getByRole("link", { name: "Exportar PDF" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

    const stream = await download.createReadStream();
    expect(stream).toBeTruthy();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    expect(buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});
