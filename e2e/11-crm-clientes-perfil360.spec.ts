import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test.describe("CRM — Clientes (extensão 360°, LGPD, tags)", () => {
  test("cadastro de cliente com campos novos e perfil 360", async ({ page }) => {
    test.setTimeout(60_000);
    const erros = coletarErrosDeConsole(page);
    const nome = `Cliente CRM E2E ${Date.now()}`;

    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByLabel("Nome").fill(nome);
    await page.getByLabel("WhatsApp (opcional)").fill("11999998888");
    await page.getByLabel("Origem (opcional)").fill("Indicação");
    await page.getByLabel("Tags (opcional)").fill("vip, delivery");
    await page.getByLabel("Data de nascimento (opcional)").fill("1990-05-20");
    await page.getByLabel("Restrições alimentares (opcional)").fill("Sem lactose");
    await page.getByRole("button", { name: "Salvar" }).click();

    const linha = page.getByRole("row", { name: new RegExp(nome) });
    await expect(linha).toBeVisible({ timeout: 10_000 });

    await linha.getByRole("link", { name: nome }).click();
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();

    // Tags aparecem como badges no cabeçalho do perfil.
    await expect(page.getByText("vip", { exact: true })).toBeVisible();
    await expect(page.getByText("delivery", { exact: true })).toBeVisible();
    await expect(page.getByText("WhatsApp: 11999998888")).toBeVisible();

    // Consentimento LGPD.
    await expect(page.getByText("Sem consentimento LGPD")).toBeVisible();
    await page.getByRole("button", { name: "Registrar consentimento" }).click();
    await expect(page.getByText("Consentimento LGPD concedido")).toBeVisible({ timeout: 10_000 });

    // Seções do perfil 360.
    await expect(page.getByRole("heading", { name: "Produtos favoritos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Canal preferido" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fidelidade — pontos" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cashback" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Interações e comunicação" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cupons utilizados" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tarefas" })).toBeVisible();

    // Registrar uma interação (nota) direto do perfil.
    await page.getByPlaceholder("Conteúdo").fill("Cliente ligou pedindo cardápio.");
    await page.getByRole("button", { name: "Registrar interação" }).click();
    await expect(page.getByText("Cliente ligou pedindo cardápio.")).toBeVisible({ timeout: 10_000 });

    // Nova tarefa associada ao cliente.
    await page.getByRole("button", { name: "Nova tarefa" }).click();
    await page.getByLabel("Título").fill("Ligar para confirmar pedido");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Ligar para confirmar pedido")).toBeVisible({ timeout: 10_000 });

    expect(erros, `Erros JS no perfil do cliente:\n${erros.join("\n")}`).toEqual([]);
  });
});
