import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

test.describe("Pedidos", () => {
  test("criar pedido, adicionar item e percorrer todo o ciclo de status até entregue", async ({ page }) => {
    // Ciclo completo de status (5 transições) em modo dev — ver nota em
    // 06-mesas.spec.ts sobre o orçamento de tempo do webServer de dev.
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);

    await page.goto("/pedidos");
    await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();

    await page.getByRole("link", { name: "Novo pedido" }).click();
    await expect(page).toHaveURL(/\/pedidos\/novo/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 10_000 });

    // Adiciona o item de teste ao pedido.
    await page.getByRole("button", { name: "Selecionar item..." }).click();
    await page.locator("[cmdk-item]", { hasText: E2E_PRODUTO_NOME }).click();
    await page.getByRole("button", { name: "Adicionar" }).click();

    await expect(page.getByText(E2E_PRODUTO_NOME)).toBeVisible({ timeout: 10_000 });

    // Confirmar -> Iniciar preparo -> Marcar pronto -> Concluir.
    await page.getByRole("button", { name: "Confirmar pedido" }).click();
    await expect(page.getByText("Confirmado", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Iniciar preparo" }).click();
    await expect(page.getByText("Em preparo", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Marcar pronto" }).click();
    await expect(page.getByText("Pronto", { exact: true })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Concluir pedido" }).click();
    await expect(page.getByText("Entregue", { exact: true })).toBeVisible({ timeout: 10_000 });

    // Comprovante de pedido deve ter sido enfileirado automaticamente.
    await expect(page.getByText("Comprovante do pedido")).toBeVisible();

    expect(erros, `Erros JS na tela de pedido:\n${erros.join("\n")}`).toEqual([]);
  });

  test("criar e cancelar pedido com motivo obrigatório", async ({ page }) => {
    await page.goto("/pedidos/novo");
    await page.getByRole("button", { name: "Criar pedido" }).click();
    await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 10_000 });

    await page.getByRole("button", { name: "Cancelar pedido" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Cancelar pedido" })).toBeVisible();

    // Confirmar sem motivo deve ficar bloqueado (requireReason).
    const confirmarButton = dialog.getByRole("button", { name: "Cancelar pedido" });
    await expect(confirmarButton).toBeDisabled();

    await dialog.getByLabel("Motivo do cancelamento").fill("Teste automatizado Playwright");
    await expect(confirmarButton).toBeEnabled();
    await confirmarButton.click();

    await expect(page.getByText("Cancelado", { exact: true })).toBeVisible({ timeout: 10_000 });
  });
});
