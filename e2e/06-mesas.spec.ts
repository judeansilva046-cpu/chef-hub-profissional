import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

test("Mesas: criar mesa, abrir comanda, pedir, concluir e fechar comanda", async ({ page }) => {
  // Fluxo longo (mesa -> comanda -> pedido -> 4 transições de status ->
  // fechar comanda), cada passo com round-trip real ao Supabase — em modo
  // dev do Next.js a soma passa dos 30s default (confirmado nos logs do
  // servidor: todas as Server Actions retornam 200, só o relógio do teste
  // é curto demais para o fluxo inteiro).
  test.setTimeout(90_000);
  const erros = coletarErrosDeConsole(page);

  const identificador = `Mesa E2E ${Date.now()}`;

  await page.goto("/mesas");
  await expect(page.getByRole("heading", { name: "Mesas" })).toBeVisible();

  await page.getByRole("button", { name: "Nova mesa" }).click();
  await page.getByLabel("Identificador").fill(identificador);
  await page.getByRole("button", { name: "Criar mesa" }).click();

  const mesaLink = page.getByRole("link", { name: new RegExp(identificador) });
  await expect(mesaLink).toBeVisible({ timeout: 10_000 });
  const mesaHref = await mesaLink.getAttribute("href");
  if (!mesaHref) throw new Error("Link da mesa sem href.");
  const mesaUrl = new URL(mesaHref, page.url()).toString();

  await mesaLink.click();
  await page.waitForURL(mesaUrl, { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Abrir comanda" })).toBeVisible();
  await page.getByRole("button", { name: "Abrir comanda" }).click();

  await expect(page.getByText("Comanda aberta", { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Novo pedido nesta comanda" }).click();
  await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]{36}$/, { timeout: 10_000 });

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
  await page.getByRole("button", { name: "Concluir pedido" }).click();
  await expect(page.getByText("Entregue", { exact: true })).toBeVisible({ timeout: 10_000 });

  // Volta para a mesa e fecha a comanda.
  await page.goto(mesaUrl);
  await expect(page.getByText("Comanda aberta", { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Fechar comanda" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Fechar comanda" })).toBeVisible();
  await dialog.getByRole("button", { name: "Fechar comanda" }).click();

  await expect(page.getByRole("button", { name: "Abrir comanda" })).toBeVisible({ timeout: 10_000 });

  expect(erros, `Erros JS em Mesas:\n${erros.join("\n")}`).toEqual([]);
});
