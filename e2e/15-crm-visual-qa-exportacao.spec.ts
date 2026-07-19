import { expect, test } from "@playwright/test";

import { coletarErrosDeConsole } from "./fixtures";

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
};

const TELAS_CRM: { nome: string; url: string; heading: RegExp }[] = [
  { nome: "crm-dashboard", url: "/crm/dashboard", heading: /CRM/ },
  { nome: "crm-segmentacao", url: "/crm/segmentacao", heading: /CRM/ },
  { nome: "crm-fidelidade", url: "/crm/fidelidade", heading: /CRM/ },
  { nome: "crm-cashback", url: "/crm/cashback", heading: /CRM/ },
  { nome: "crm-cupons", url: "/crm/cupons", heading: /CRM/ },
  { nome: "crm-comunicacao", url: "/crm/comunicacao", heading: /CRM/ },
  { nome: "crm-campanhas", url: "/crm/campanhas", heading: /CRM/ },
  { nome: "crm-funil", url: "/crm/funil", heading: /CRM/ },
  { nome: "crm-tarefas", url: "/crm/tarefas", heading: /CRM/ },
];

for (const tela of TELAS_CRM) {
  test(`QA visual CRM: ${tela.nome} (desktop + mobile)`, async ({ page }) => {
    const erros = coletarErrosDeConsole(page);

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto(tela.url);
    await expect(page.getByRole("heading", { name: tela.heading }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `e2e-report/screenshots/${tela.nome}-desktop.png`, fullPage: true });

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.reload();
    await expect(page.getByRole("heading", { name: tela.heading }).first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: `e2e-report/screenshots/${tela.nome}-mobile.png`, fullPage: true });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, `${tela.nome}: overflow horizontal detectado em viewport mobile`).toBe(false);

    expect(erros, `Erros JS em ${tela.nome}:\n${erros.join("\n")}`).toEqual([]);
  });
}

test("CRM: exportação de clientes (Excel e PDF)", async ({ page }) => {
  await page.goto("/crm/segmentacao");
  await expect(page.getByRole("link", { name: "Exportar Excel" })).toBeVisible();

  const respostaExcel = await page.request.get("/api/crm/exportar/clientes?formato=xlsx");
  expect(respostaExcel.ok()).toBe(true);
  expect(respostaExcel.headers()["content-type"]).toContain("spreadsheetml");

  const respostaPdf = await page.request.get("/api/crm/exportar/clientes?formato=pdf");
  expect(respostaPdf.ok()).toBe(true);
  expect(respostaPdf.headers()["content-type"]).toContain("application/pdf");
});
