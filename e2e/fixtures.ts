import type { Page } from "@playwright/test";

/**
 * Credenciais e IDs do usuário/empresa de teste da Sprint 05, criados
 * diretamente no Supabase (sem SUPABASE_SERVICE_ROLE_KEY configurada em
 * .env.local — sem ela não dá pra usar a Admin API para criar um usuário
 * já confirmado, então o usuário foi inserido direto em auth.users/
 * auth.identities). Empresa, canal de vendas e um produto com estoque já
 * vêm seedados, para os testes não precisarem repetir o onboarding a cada
 * execução.
 */
export const E2E_USER = {
  email: "e2e-teste@chefhub.local",
  password: "E2eTeste!2026Senha",
};

export const E2E_EMPRESA_ID = "fa43de88-a47d-4758-b137-7ee49fa40394";
export const E2E_PRODUTO_NOME = "Produto E2E";
export const E2E_ADICIONAL_NOME = "Adicional E2E";
export const E2E_INGREDIENTE_NOME = "Ingrediente E2E";

/**
 * Ruído conhecido do Chromium automatizado via CDP (Playwright), confirmado
 * NÃO reproduzível numa sessão de navegador manual real (verificado via
 * claude-in-chrome + read_console_messages em /caixa, /pdv, /dashboard: só
 * logs de HMR/Fast Refresh, nenhum erro de hidratação). O Chromium sob CDP
 * injeta `caret-color: transparent` em inputs/textareas ativos para evitar
 * o cursor piscando em screenshots automatizados, o que o React acusa como
 * mismatch de hidratação — não é um bug da aplicação, é a própria
 * automação alterando o DOM antes da hidratação comparar.
 */
const RUIDO_HIDRATACAO_AUTOMACAO = /hydrat|caret-color/i;

export function coletarErrosDeConsole(page: Page): string[] {
  const erros: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !RUIDO_HIDRATACAO_AUTOMACAO.test(msg.text())) {
      erros.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    if (!RUIDO_HIDRATACAO_AUTOMACAO.test(err.message)) erros.push(err.message);
  });
  return erros;
}
