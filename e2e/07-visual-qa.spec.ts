import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

const TELAS_AUTENTICADAS: { nome: string; url: string; heading: RegExp }[] = [
  { nome: "dashboard", url: "/dashboard", heading: /Dashboard/ },
  { nome: "pedidos", url: "/pedidos", heading: /Pedidos/ },
  { nome: "caixa", url: "/caixa", heading: /Caixa/ },
  { nome: "mesas", url: "/mesas", heading: /Mesas/ },
];

for (const tela of TELAS_AUTENTICADAS) {
  test(`QA visual: ${tela.nome} (desktop + mobile, claro + escuro)`, async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(tela.url);
    await expect(page.getByRole("heading", { name: tela.heading }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `e2e-report/screenshots/${tela.nome}-desktop-claro.png`, fullPage: true });

    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.screenshot({ path: `e2e-report/screenshots/${tela.nome}-desktop-escuro.png`, fullPage: true });
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.reload();
    await expect(page.getByRole("heading", { name: tela.heading }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `e2e-report/screenshots/${tela.nome}-mobile.png`, fullPage: true });

    // Sem scroll horizontal na largura mobile (responsividade).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, `${tela.nome}: overflow horizontal detectado em viewport mobile`).toBe(false);

    expect(erros, `Erros JS em ${tela.nome}:\n${erros.join("\n")}`).toEqual([]);
  });
}

test("QA visual: PDV (tablet, tela cheia)", async ({ page }) => {
  const erros = coletarErrosDeConsole(page);

  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/pdv");
  await expect(page.getByText("Novo pedido", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "e2e-report/screenshots/pdv-tablet.png", fullPage: true });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.reload();
  await expect(page.getByText("Novo pedido", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "e2e-report/screenshots/pdv-desktop.png", fullPage: true });

  expect(erros, `Erros JS no PDV:\n${erros.join("\n")}`).toEqual([]);
});

test("QA visual: KDS (tela cheia, tema escuro forçado)", async ({ page }) => {
  const erros = coletarErrosDeConsole(page);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/kds");
  await expect(page.getByText("KDS", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "e2e-report/screenshots/kds-desktop.png", fullPage: true });

  expect(erros, `Erros JS no KDS:\n${erros.join("\n")}`).toEqual([]);
});

test("QA visual: login (sem sessão)", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const erros = coletarErrosDeConsole(page);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await page.screenshot({ path: "e2e-report/screenshots/login-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await page.screenshot({ path: "e2e-report/screenshots/login-mobile.png", fullPage: true });

  expect(erros, `Erros JS no login:\n${erros.join("\n")}`).toEqual([]);
  await context.close();
});
