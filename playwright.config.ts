import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  // 1 retry: absorve a latência de primeira compilação do Next dev server
  // por rota (não reflete comportamento de produção) — visto repetidamente
  // quando a suíte inteira visita muitas rotas pela primeira vez em
  // sequência; não mascara falha real (falha real falha nas duas tentativas).
  retries: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3010",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3010/login",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
