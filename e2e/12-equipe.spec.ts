import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

test("Equipe carrega com heading e gestão visível para owner", async ({
  page,
}) => {
  const erros = coletarErrosDeConsole(page);

  await page.goto("/equipe");
  await expect(page.getByRole("heading", { name: /Equipe/ })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: /Convidar membro/i }).click();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Papel")).toBeVisible();

  expect(erros, `Erros de console em /equipe:\n${erros.join("\n")}`).toEqual([]);
});
