import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_INGREDIENTE_NOME } from "./fixtures";

test.describe("Compras — fluxo completo", () => {
  test("fornecedor → preço → solicitação → aprovação → cotação → pedido → recebimento", async ({ page }) => {
    // Ciclo completo do módulo de Compras: um único teste em sequência (mesmo
    // padrão de e2e/03-pedidos.spec.ts) porque cada etapa depende do estado
    // criado pela etapa anterior (fornecedor → cotação → pedido).
    test.setTimeout(120_000);
    const erros = coletarErrosDeConsole(page);
    const nomeFornecedor = `Fornecedor E2E ${Date.now()}`;

    // ---- 1. Cadastrar fornecedor -----------------------------------------
    await page.goto("/compras/fornecedores");
    await expect(page.getByRole("heading", { name: "Fornecedores" })).toBeVisible();

    await page.getByRole("button", { name: "Novo fornecedor" }).click();
    const dialogFornecedor = page.getByRole("dialog");
    await dialogFornecedor.getByLabel("Razão social").fill(nomeFornecedor);
    await dialogFornecedor.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("link", { name: nomeFornecedor })).toBeVisible({ timeout: 10_000 });

    // ---- 2. Cadastrar preço do fornecedor para o ingrediente de teste -----
    await page.goto("/compras/precos");
    await expect(page.getByRole("heading", { name: "Comparativo de preços" })).toBeVisible();

    const cardIngrediente = page.locator("div", { has: page.getByRole("heading", { name: E2E_INGREDIENTE_NOME, exact: true }) }).first();
    await cardIngrediente.getByRole("button", { name: "Adicionar preço" }).click();

    const dialogPreco = page.getByRole("dialog");
    await dialogPreco.getByLabel("Fornecedor", { exact: true }).selectOption({ label: nomeFornecedor });
    await dialogPreco.getByLabel("Preço unitário").fill("10,00");
    await dialogPreco.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByRole("row", { name: new RegExp(nomeFornecedor) })).toBeVisible({ timeout: 10_000 });

    // ---- 3. Criar solicitação de compra ------------------------------------
    await page.goto("/compras/solicitacoes/nova");
    await expect(page.getByRole("heading", { name: "Nova solicitação de compra" })).toBeVisible();

    await page.getByRole("button", { name: "Selecionar ingrediente..." }).click();
    await page.locator("[cmdk-item]", { hasText: E2E_INGREDIENTE_NOME }).click();
    await page.locator('input[placeholder^="Qtd."]').fill("5");

    await page.getByRole("button", { name: "Criar solicitação" }).click();
    await expect(page).toHaveURL(/\/compras\/solicitacoes\/[0-9a-f-]{36}$/, { timeout: 15_000 });
    await expect(page.getByText("Pendente", { exact: true })).toBeVisible({ timeout: 10_000 });

    // ---- 4. Aprovar a solicitação -------------------------------------------
    await page.getByRole("button", { name: "Aprovar", exact: true }).click();
    const dialogAprovar = page.getByRole("dialog");
    await expect(dialogAprovar.getByRole("heading", { name: "Aprovar solicitação" })).toBeVisible();
    await dialogAprovar.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Aprovada", { exact: true })).toBeVisible({ timeout: 10_000 });

    // ---- 5. Criar cotação a partir da solicitação aprovada -----------------
    await page.goto("/compras/cotacoes/nova");
    await expect(page.getByRole("heading", { name: "Nova cotação" })).toBeVisible();

    await page
      .getByLabel("Criar a partir de uma solicitação aprovada (opcional)")
      .selectOption({ index: 1 });
    await expect(page.locator('input[placeholder^="Qtd."]')).toHaveValue("5", { timeout: 5_000 });

    await page.getByLabel(nomeFornecedor).check();
    await page.getByRole("button", { name: "Criar cotação" }).click();

    await expect(page).toHaveURL(/\/compras\/cotacoes\/[0-9a-f-]{36}$/, { timeout: 15_000 });

    // ---- 6. Registrar proposta e finalizar automaticamente -----------------
    await page.getByRole("button", { name: "Registrar proposta" }).click();
    const dialogProposta = page.getByRole("dialog");
    await expect(dialogProposta.getByRole("heading", { name: `Proposta de ${nomeFornecedor}` })).toBeVisible();
    await dialogProposta.getByPlaceholder("R$ 0,00 / un.").fill("9,50");
    await dialogProposta.getByRole("button", { name: "Salvar proposta" }).click();
    await expect(dialogProposta).not.toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole("button", { name: "Editar proposta" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Finalizar automaticamente (menor custo)" }).click();
    const dialogConfirmar = page.getByRole("dialog");
    await expect(dialogConfirmar.getByRole("heading", { name: "Confirmar escolha automática" })).toBeVisible();
    await dialogConfirmar.getByRole("button", { name: "Confirmar" }).click();

    // ---- 7. Pedido de compra criado — receber o item ------------------------
    await expect(page).toHaveURL(/\/compras\/pedidos\/[0-9a-f-]{36}$/, { timeout: 15_000 });
    await expect(page.getByText(nomeFornecedor).first()).toBeVisible();

    await page.getByRole("button", { name: "Receber" }).click();
    const dialogReceber = page.getByRole("dialog");
    await expect(dialogReceber.getByRole("heading", { name: `Receber ${E2E_INGREDIENTE_NOME}` })).toBeVisible();
    await dialogReceber.getByRole("button", { name: "Confirmar recebimento" }).click();

    await expect(page.getByText("Recebido", { exact: true })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS no fluxo de Compras:\n${erros.join("\n")}`).toEqual([]);
  });
});
