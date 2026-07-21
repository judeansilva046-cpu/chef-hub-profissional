import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test("Equipe carrega com heading visível", async ({ page }) => {
  const erros = coletarErrosDeConsole(page);

  await page.goto("/equipe");
  await expect(page.getByRole("heading", { name: /Equipe/ })).toBeVisible({
    timeout: 15_000,
  });

  expect(erros, `Erros de console em /equipe:\n${erros.join("\n")}`).toEqual([]);
});
