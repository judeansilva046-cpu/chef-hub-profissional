import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

function amanha(): string {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  return data.toISOString().slice(0, 10);
}

test.describe("Financeiro — Contas a Pagar e Contas a Receber", () => {
  test("contas a pagar: criar conta manual e registrar pagamento", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const descricao = `Conta a pagar E2E ${Date.now()}`;

    await page.goto("/financeiro/contas-a-pagar");
    await expect(page.getByRole("heading", { name: "Contas a pagar" })).toBeVisible();

    await page.getByRole("button", { name: "Nova conta" }).click();
    await page.getByLabel("Descrição").fill(descricao);
    await page.getByLabel("Valor").fill("123.45");
    await page.getByLabel("Vencimento").fill(amanha());
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(descricao) });
    await expect(linha).toBeVisible({ timeout: 10_000 });
    await expect(linha.getByText("Pendente", { exact: true })).toBeVisible();

    await linha.getByRole("button", { name: "Pagar" }).click();
    await expect(page.getByRole("heading", { name: "Registrar pagamento" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar pagamento" }).click();

    await expect(page.getByRole("row", { name: new RegExp(descricao) }).getByText("Pago", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    expect(erros, `Erros JS em Contas a Pagar:\n${erros.join("\n")}`).toEqual([]);
  });

  test("contas a receber: criar conta parcelada e receber a primeira parcela", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const descricao = `Conta a receber E2E ${Date.now()}`;

    await page.goto("/financeiro/contas-a-receber");
    await expect(page.getByRole("heading", { name: "Contas a receber" })).toBeVisible();

    await page.getByRole("button", { name: "Nova conta" }).click();
    await page.getByLabel("Descrição").fill(descricao);
    await page.getByLabel("Valor total").fill("300");
    await page.getByLabel("Parcelas").fill("3");
    await page.getByLabel("1º vencimento").fill(amanha());
    await page.getByRole("button", { name: "Salvar" }).click();

    // Cada conta é um <div class="border-border flex flex-col gap-2 rounded-lg border p-4">
    // (não uma <table>/<tr>) — precisa da classe específica do card, não só
    // "div com o texto dentro", porque o container que envolve TODOS os
    // cards também "tem" o texto como descendente e seria pego por engano
    // (inclusive casando com outras contas de testes anteriores).
    const cartao = page.locator("div.border-border.rounded-lg.border.p-4", {
      has: page.getByText(descricao, { exact: true }),
    });
    await expect(cartao).toBeVisible({ timeout: 10_000 });
    await expect(cartao.getByText("em 3x")).toBeVisible();
    await expect(cartao.getByText("Parcela 1")).toBeVisible();

    await cartao.getByRole("button", { name: "Receber" }).first().click();
    await expect(page.getByRole("heading", { name: "Registrar recebimento" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar recebimento" }).click();

    await expect(cartao.getByText("Parcialmente recebido")).toBeVisible({ timeout: 10_000 });
    await expect(cartao.getByText("Recebida", { exact: true })).toBeVisible();

    expect(erros, `Erros JS em Contas a Receber:\n${erros.join("\n")}`).toEqual([]);
  });
});
