import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

test.describe("Expedição", () => {
  test("pedido de retirada entra na fila e conclui pela Expedição", async ({ page }) => {
    test.setTimeout(120_000);
    const erros = coletarErrosDeConsole(page);

    await page.goto("/pedidos/novo");
    await page.getByLabel("Tipo do pedido").selectOption("retirada");
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 10_000 });

    const pedidoUrl = page.url();

    await page.getByRole("button", { name: "Selecionar item..." }).click();
    await page.locator("[cmdk-item]", { hasText: E2E_PRODUTO_NOME }).click();
    await page.getByRole("button", { name: "Adicionar" }).click();
    await expect(page.getByText(E2E_PRODUTO_NOME)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText("Confirmado", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Iniciar preparo" }).click();
    await expect(page.getByText("Em preparo", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Marcar pronto" }).click();
    await expect(page.getByText("Pronto", { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Conclusão via Expedição")).toBeVisible();

    await page.goto("/expedicao");
    await expect(page.getByRole("heading", { name: "Expedição" })).toBeVisible({ timeout: 15_000 });

    // Avança: Aguardando → Conferido → Embalado → Saiu → Entregue (retirada sem entregador).
    const card = page.locator("div").filter({ hasText: "Retirada" }).first();
    await expect(card.getByRole("button", { name: "Conferir" })).toBeVisible({ timeout: 15_000 });
    await card.getByRole("button", { name: "Conferir" }).click();

    await expect(page.getByRole("button", { name: "Embalar" }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Embalar" }).first().click();

    await expect(page.getByRole("button", { name: "Saiu para entrega" }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Saiu para entrega" }).first().click();

    await expect(page.getByRole("button", { name: "Marcar entregue" }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Marcar entregue" }).first().click();

    await page.goto(pedidoUrl);
    await expect(page.getByText("Entregue", { exact: true })).toBeVisible({ timeout: 15_000 });

    expect(erros, `Erros JS na Expedição:\n${erros.join("\n")}`).toEqual([]);
  });
});
