import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

test("PDV: adicionar produto ao carrinho, pagar e finalizar venda", async ({ page }) => {
  test.setTimeout(60_000);
  const erros = coletarErrosDeConsole(page);

  await page.goto("/pdv");
  await expect(page.getByText("Novo pedido", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: new RegExp(E2E_PRODUTO_NOME) }).click();

  await expect(page).toHaveURL(/\/pdv\?pedidoId=/, { timeout: 10_000 });
  await expect(page.getByText(/Pedido #\d+/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(E2E_PRODUTO_NOME).first()).toBeVisible();

  // Registra o pagamento com o valor total já preenchido por padrão.
  await page.getByRole("button", { name: "Registrar pagamento" }).click();
  await expect(page.getByText("Pago", { exact: true })).toBeVisible({ timeout: 10_000 });

  const finalizarButton = page.getByRole("button", { name: "Finalizar venda" });
  await expect(finalizarButton).toBeEnabled({ timeout: 10_000 });
  await finalizarButton.click();

  // Volta para um carrinho vazio (venda concluída com sucesso).
  await expect(page).toHaveURL(/\/pdv$/, { timeout: 15_000 });
  await expect(page.getByText("Carrinho vazio", { exact: false })).toBeVisible({ timeout: 10_000 });

  expect(erros, `Erros JS no PDV:\n${erros.join("\n")}`).toEqual([]);
});
