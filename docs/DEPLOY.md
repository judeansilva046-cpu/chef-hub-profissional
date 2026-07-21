# Deploy — Chef Hub Profissional

Checklist do próximo passo operacional após o merge da auditoria/hardening.

## 1. Aplicar migrations no Supabase

### Opção rápida (SQL Editor)

1. Abra o **SQL Editor** do projeto Supabase.
2. Cole o conteúdo de
   [`docs/sql/aplicar-0040-a-0042.sql`](./sql/aplicar-0040-a-0042.sql)
   (bundle das migrations `0040` + `0041` + `0042`).
3. Execute. Se alguma migration já tiver sido aplicada, o script pode falhar
   em objetos existentes — nesse caso aplique só os arquivos que faltam em
   `supabase/migrations/`.

### Opção CLI

```bash
supabase db push
# ou: supabase migration up
```

### Validação SQL

Cole e rode `supabase/tests/checkpoint3_hardening_0040.sql` (com
`request.jwt.claim.sub` do usuário dono da empresa de teste). Deve retornar
`OK: checkpoint 3 passou`.

## 2. Variáveis de ambiente (produção)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INTEGRACOES_SECRET_KEY=   # 32 bytes base64
# NÃO defina INTEGRACOES_WEBHOOKS_ALLOW_UNSIGNED em produção
```

## 3. Smoke test manual (5 min)

1. Login → Dashboard
2. Abrir caixa → PDV (venda balcão) → ver venda no Dashboard
3. Pedido → KDS (iniciar + marcar pronto)
4. Pedido tipo Retirada → Expedição até entregue
5. Relatórios → Exportar PDF
6. `/financeiro/funcionarios` → cadastrar um colaborador
7. (Opcional) `cd agents/impressao && CHEF_HUB_BASE_URL=... CHEF_HUB_API_KEY=... npm start`

## 4. E2E local

```bash
cp .env.example .env.local   # preencher
npx playwright install chromium
npm run test:e2e
```

Specs novas: `e2e/08-kds`, `09-expedicao`, `10-financeiro-estoque`.

## 5. Depois do deploy estável

- Expandir cobertura e2e de estoque/compras se necessário
- Homologar integrações marketplace (credenciais de parceiro)
- RBAC multi-operador, se houver mais de um usuário por empresa
