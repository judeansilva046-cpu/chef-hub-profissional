import { expect, test, type Browser } from "@playwright/test";

import {
  coletarErrosDeConsole,
  E2E_OPERADORES,
  E2E_USER,
  type E2EOperador,
  loginComCredenciais,
} from "./fixtures";

test.describe("RBAC — owner (sessão padrão)", () => {
  test("nav mostra Equipe e acessa /equipe", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Equipe" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Estoque" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Financeiro" })).toBeVisible();

    await page.goto("/equipe");
    await expect(page.getByRole("heading", { name: /Equipe/ })).toBeVisible({
      timeout: 15_000,
    });

    expect(erros, `Erros de console:\n${erros.join("\n")}`).toEqual([]);
  });
});

async function rodarCenarioOperador(
  browser: Browser,
  operador: E2EOperador,
): Promise<"ok" | "sem-seed"> {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  const erros = coletarErrosDeConsole(page);

  const logou = await loginComCredenciais(
    page,
    operador.email,
    operador.password,
  );
  if (!logou) {
    await context.close();
    return "sem-seed";
  }

  const homeRe = new RegExp(
    `^${operador.homePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`,
  );

  // Rota de back-office → home do papel
  await page.goto("/financeiro");
  await expect(page).toHaveURL(homeRe, { timeout: 15_000 });

  await page.goto("/equipe");
  await expect(page).toHaveURL(homeRe, { timeout: 15_000 });

  // Nav filtrada no layout (app) — dashboard é permitido a todos
  await page.goto("/dashboard");
  await expect(page.locator("nav").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Equipe" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Financeiro" })).toHaveCount(0);

  for (const href of operador.deveVer) {
    await expect(page.locator(`nav a[href="${href}"]`).first()).toBeVisible();
  }
  for (const href of operador.naoDeveVer) {
    await expect(page.locator(`nav a[href="${href}"]`)).toHaveCount(0);
  }

  expect(
    erros,
    `Erros de console (${operador.papel}):\n${erros.join("\n")}`,
  ).toEqual([]);

  await context.close();
  return "ok";
}

for (const operador of E2E_OPERADORES) {
  test(`RBAC — papel ${operador.papel} redireciona e filtra nav`, async ({
    browser,
  }) => {
    const resultado = await rodarCenarioOperador(browser, operador);
    test.skip(
      resultado === "sem-seed",
      `Sem seed do operador ${operador.email} — aplique docs/sql/seed-e2e-operadores-rbac.sql`,
    );
  });
}

test("login owner ainda funciona (sanity)", async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  const logou = await loginComCredenciais(
    page,
    E2E_USER.email,
    E2E_USER.password,
  );
  expect(logou).toBe(true);
  await context.close();
});
