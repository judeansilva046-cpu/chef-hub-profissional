import { expect, test as setup } from "@playwright/test";

import { E2E_USER } from "./fixtures";

const AUTH_FILE = "e2e/.auth/user.json";

setup("login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(E2E_USER.email);
  await page.getByLabel("Senha").fill(E2E_USER.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/fichas-tecnicas/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
