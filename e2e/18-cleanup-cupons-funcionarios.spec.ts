import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_PRODUTO_NOME } from "./fixtures";

test.describe("Cleanup pré-Sprint 09 — cupons grátis no PDV e funcionários", () => {
  test("PDV: cupom de produto grátis adiciona o item a R$ 0,00", async ({ page }) => {
    test.setTimeout(90_000);
    const erros = coletarErrosDeConsole(page);
    const nomeCliente = `Cliente Cupom E2E ${Date.now()}`;
    const codigoCupom = `GRATIS${Date.now() % 1000000}`;

    // ---- 1. Cadastrar cliente ---------------------------------------------
    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill(nomeCliente);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nomeCliente) })).toBeVisible({ timeout: 10_000 });

    // ---- 2. Criar cupom de produto grátis concedendo o produto de teste ---
    await page.goto("/crm/cupons");
    await expect(page.getByRole("heading", { name: "Cupons" })).toBeVisible();
    await page.getByRole("button", { name: "Novo cupom" }).click();
    await page.getByLabel("Código").fill(codigoCupom);
    await page.getByLabel("Tipo").selectOption("produto_gratis");
    await page.getByLabel("Produto concedido").selectOption({ label: E2E_PRODUTO_NOME });
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(codigoCupom, "i") })).toBeVisible({ timeout: 10_000 });

    // ---- 3. PDV: selecionar cliente ANTES do primeiro item (o combobox de
    // cliente trava assim que o pedido existe) -----------------------------
    await page.goto("/pdv");
    await page.getByRole("button", { name: "Sem cliente" }).click();
    await page.locator("[cmdk-item]", { hasText: nomeCliente }).click();

    await page.getByRole("button", { name: new RegExp(E2E_PRODUTO_NOME) }).click();
    await expect(page).toHaveURL(/\/pdv\?pedidoId=/, { timeout: 10_000 });
    await expect(page.getByText(E2E_PRODUTO_NOME).first()).toBeVisible({ timeout: 10_000 });

    // ---- 4. Aplicar o cupom de produto grátis ------------------------------
    await page.getByPlaceholder("Código do cupom").fill(codigoCupom);
    await page.getByRole("button", { name: "Aplicar cupom" }).click();

    // O produto concedido entra como um SEGUNDO item do carrinho, a R$ 0,00 un.
    await expect(page.getByText("R$ 0,00 un.")).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS no fluxo de cupom grátis:\n${erros.join("\n")}`).toEqual([]);
  });

  test("PDV: cupom de frete grátis é aceito sem erro (efeito visual não exposto em pedido balcão)", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nomeCliente = `Cliente Frete E2E ${Date.now()}`;
    const codigoCupom = `FRETE${Date.now() % 1000000}`;

    await page.goto("/clientes");
    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill(nomeCliente);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(nomeCliente) })).toBeVisible({ timeout: 10_000 });

    await page.goto("/crm/cupons");
    await page.getByRole("button", { name: "Novo cupom" }).click();
    await page.getByLabel("Código").fill(codigoCupom);
    await page.getByLabel("Tipo").selectOption("frete_gratis");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("row", { name: new RegExp(codigoCupom, "i") })).toBeVisible({ timeout: 10_000 });

    await page.goto("/pdv");
    await page.getByRole("button", { name: "Sem cliente" }).click();
    await page.locator("[cmdk-item]", { hasText: nomeCliente }).click();
    await page.getByRole("button", { name: new RegExp(E2E_PRODUTO_NOME) }).click();
    await expect(page).toHaveURL(/\/pdv\?pedidoId=/, { timeout: 10_000 });

    await page.getByPlaceholder("Código do cupom").fill(codigoCupom);
    await page.getByRole("button", { name: "Aplicar cupom" }).click();

    // Antes desta sprint isso mostrava "Este tipo de cupom ainda não é
    // aplicado automaticamente no PDV." — a ausência desse erro é o sinal
    // de que o tipo passou a ser tratado.
    await expect(page.getByText("ainda não é aplicado automaticamente")).not.toBeVisible({ timeout: 5_000 });

    expect(erros, `Erros JS no fluxo de cupom de frete grátis:\n${erros.join("\n")}`).toEqual([]);
  });

  test("Funcionários: cadastrar e ver custo mensal/hora calculado", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nome = `Funcionário E2E ${Date.now()}`;

    await page.goto("/financeiro/funcionarios");
    await expect(page.getByRole("heading", { name: "Calculadora de custos de funcionários" })).toBeVisible();

    await page.getByRole("button", { name: "Novo funcionário" }).first().click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel(/Salário mensal|Valor da hora/).fill("3000");
    await page.getByLabel("Carga horária semanal, horas").fill("44");
    await page.getByLabel(/Encargos, %/).fill("35");

    // Prévia de custo calculada no próprio diálogo, antes de salvar.
    await expect(page.getByText("Custo mensal total (estimado)")).toBeVisible();

    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Ativo", { exact: true })).toBeVisible();

    await linha.getByRole("button", { name: "Desligar" }).click();
    await expect(linha.getByText("Inativo", { exact: true })).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS em Funcionários:\n${erros.join("\n")}`).toEqual([]);
  });
});
