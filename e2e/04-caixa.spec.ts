import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe.serial("Caixa", () => {
  test("abrir caixa, registrar suprimento e fechar", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);

    await page.goto("/caixa");
    await expect(page.getByRole("heading", { name: "Caixa" })).toBeVisible();

    const jaAberto = await page
      .getByText("Caixa aberto")
      .isVisible()
      .catch(() => false);

    if (!jaAberto) {
      await expect(page.getByText("Saldo inicial", { exact: true })).toBeVisible();
      const saldoInicialInput = page.locator('input[inputmode="decimal"]').first();
      await saldoInicialInput.fill("100,00");
      await saldoInicialInput.press("Tab"); // NumberField só aplica o valor no blur.
      await page.getByRole("button", { name: "Abrir caixa" }).click();
      await expect(page.getByText("Caixa aberto")).toBeVisible({ timeout: 10_000 });
    }

    // Registra um suprimento (tipo default do seletor).
    const valorMovimentacaoInput = page.locator('input[inputmode="decimal"]').first();
    await valorMovimentacaoInput.fill("50,00");
    await valorMovimentacaoInput.press("Tab");
    await page.getByRole("button", { name: "Registrar" }).click();
    await expect(page.getByText("Suprimento", { exact: false }).first()).toBeVisible({ timeout: 10_000 });

    // Fecha o caixa.
    await page.getByRole("button", { name: "Fechar caixa" }).click();
    await expect(page.getByText("Fechar caixa", { exact: true })).toBeVisible();
    const saldoContadoInput = page.locator('input[inputmode="decimal"]').last();
    await saldoContadoInput.fill("150,00");
    await saldoContadoInput.press("Tab");
    await page.getByRole("button", { name: "Confirmar fechamento" }).click();

    await expect(page.getByRole("button", { name: "Abrir caixa" })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS na tela de caixa:\n${erros.join("\n")}`).toEqual([]);
  });
});
