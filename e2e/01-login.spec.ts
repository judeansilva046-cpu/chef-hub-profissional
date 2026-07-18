import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole, E2E_USER } from "./fixtures";

// Este arquivo testa a TELA de login em si (credenciais inválidas, redirect
// após sucesso) — por isso roda com um contexto limpo, sem o storageState
// autenticado que os demais specs herdam do projeto "chromium".
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login", () => {
  test("credenciais inválidas mostram erro e não navegam", async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.goto("/login");
    await page.getByLabel("E-mail").fill(E2E_USER.email);
    await page.getByLabel("Senha").fill("senha-errada-de-proposito");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/inválid|incorret|credenciais/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    expect(erros, `Erros JS na tela de login:\n${erros.join("\n")}`).toEqual([]);
  });

  test("login válido redireciona para a área logada", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(E2E_USER.email);
    await page.getByLabel("Senha").fill(E2E_USER.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/fichas-tecnicas/, { timeout: 15_000 });
  });
});
