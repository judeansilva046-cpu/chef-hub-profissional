import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

/**
 * Ajuda compartilhada: cria pedido de balcão com o produto E2E e confirma.
 * Deixa o pedido em "confirmado" — pronto para o KDS iniciar preparo.
 */
async function criarPedidoConfirmado(page: import("@playwright/test").Page) {
  await page.goto("/pedidos/novo");
  await page.getByRole("button", { name: "Criar pedido" }).click();
  await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 10_000 });

  await page.getByRole("button", { name: "Selecionar item..." }).click();
  await page.locator("[cmdk-item]", { hasText: E2E_PRODUTO_NOME }).click();
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText(E2E_PRODUTO_NOME)).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("Confirmado", { exact: true })).toBeVisible({ timeout: 10_000 });

  return page.url().match(/\/pedidos\/([0-9a-f-]{36})/)?.[1] ?? "";
}

test.describe("KDS", () => {
  test("iniciar preparo e marcar pronto pela praça", async ({ page }) => {
    test.setTimeout(90_000);
    const erros = coletarErrosDeConsole(page);

    const pedidoId = await criarPedidoConfirmado(page);
    expect(pedidoId).toBeTruthy();

    await page.goto("/kds");
    await expect(page.getByText("KDS", { exact: true })).toBeVisible({ timeout: 15_000 });

    // Pedido aparece na coluna Novos.
    const card = page.locator("div").filter({ hasText: E2E_PRODUTO_NOME }).first();
    await expect(card.getByRole("button", { name: "Iniciar preparo" })).toBeVisible({
      timeout: 15_000,
    });
    await card.getByRole("button", { name: "Iniciar preparo" }).click();

    // Após iniciar, aparece em "Em preparo" com ação de marcar pronto.
    await expect(page.getByRole("button", { name: /Marcar pronto/ })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /Marcar pronto/ }).first().click();

    // Pedido detalhe deve refletir Pronto (ou itens prontos).
    await page.goto(`/pedidos/${pedidoId}`);
    await expect(page.getByText("Pronto", { exact: true })).toBeVisible({ timeout: 15_000 });

    expect(erros, `Erros JS no KDS:\n${erros.join("\n")}`).toEqual([]);
  });
});
