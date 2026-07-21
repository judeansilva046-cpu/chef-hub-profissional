# Deploy — Chef Hub Profissional

Checklist do próximo passo operacional após o merge da auditoria/hardening.

## 1. Aplicar migrations no Supabase

No SQL Editor do projeto Supabase (ou via CLI `supabase db push`), aplique
**nesta ordem**, se ainda não estiverem no banco:

| Arquivo | Conteúdo |
| ------- | -------- |
| `supabase/migrations/0040_security_hardening_operacional.sql` | Máquina de estados, KDS por item, PDV atômico, pagamentos/caixa |
| `supabase/migrations/0041_realtime_pedido_itens.sql` | Realtime em `pedido_itens` |
| `supabase/migrations/0042_funcionarios_custos.sql` | Tabela `funcionarios` + RLS |

> Se o projeto já estava em `0039`, só faltam essas três. Confirme com:
> `select version from supabase_migrations.schema_migrations order by version;`
> (nome da tabela pode variar conforme o fluxo de migrate usado).

### Validação SQL rápida

Cole e rode `supabase/tests/checkpoint3_hardening_0040.sql` no SQL Editor
(com `request.jwt.claim.sub` do usuário dono da empresa de teste, igual ao
checkpoint 2). Deve retornar `OK: checkpoint 3 passou`.

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
