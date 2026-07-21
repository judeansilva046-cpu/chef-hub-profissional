import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("Estoque e compras (smoke)", () => {
  test("estoque: dashboard, lotes e movimentações carregam", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/estoque");
    await expect(page.getByRole("heading", { name: "Controle de estoque" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/estoque/lotes");
    await expect(page.getByRole("heading", { name: "Lotes e validade" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/estoque/movimentacoes");
    await expect(page.getByRole("heading", { name: "Movimentações de estoque" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/estoque/etiquetas");
    await expect(page.getByRole("heading", { name: "Etiquetas de validade" })).toBeVisible({
      timeout: 15_000,
    });

    expect(erros, `Erros JS no estoque:\n${erros.join("\n")}`).toEqual([]);
  });

  test("compras: pedidos, fornecedores e solicitações carregam", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/compras/pedidos");
    await expect(page.getByRole("heading", { name: /Pedidos/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/compras/fornecedores");
    await expect(page.getByRole("heading", { name: /Fornecedores/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/compras/solicitacoes");
    await expect(page.getByRole("heading", { name: /Solicitações/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/producao");
    await expect(page.getByRole("heading", { name: /Produção/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    expect(erros, `Erros JS em compras/produção:\n${erros.join("\n")}`).toEqual([]);
  });
});
