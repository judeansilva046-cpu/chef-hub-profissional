import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test("Dashboard carrega sem erros de console", async ({ page }) => {
  const erros = coletarErrosDeConsole(page);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Dashboard/ })).toBeVisible({ timeout: 15_000 });

  expect(erros, `Erros de console em /dashboard:\n${erros.join("\n")}`).toEqual([]);
});
