# Agente local de impressão (Chef Hub)

CLI em Node.js que consulta a fila de impressão do Chef Hub e grava os
trabalhos em `./outbox/` para integração com a impressora térmica local.

## Requisitos

- Node.js 18+
- Um agente criado na tela **Etiquetas de validade** (botão "Novo agente")
- A chave de API exibida **uma única vez** na criação

## Configuração

```bash
cd agents/impressao
export CHEF_HUB_BASE_URL="https://seu-dominio.com"   # sem barra no final
export CHEF_HUB_API_KEY="chave-gerada-no-app"
npm start
# ou: node src/index.js
# ou, após npm link: chef-hub-agente
```

## Comportamento

1. A cada 5 segundos faz `GET /api/agente-impressao/trabalhos` com
   `Authorization: Bearer <CHEF_HUB_API_KEY>`.
2. O servidor já devolve os trabalhos **claimados como `processando`** —
   o agente **não** precisa marcar `processando` via PATCH.
3. Para cada trabalho:
   - grava `./outbox/{id}.json` com o payload completo;
   - imprime o payload em texto no stdout (útil para depurar);
   - envia `PATCH .../trabalhos/{id}` com `{ "status": "concluido" }`,
     ou `{ "status": "erro", "erroMensagem": "..." }` em falha.
4. `SIGINT` / `SIGTERM` encerram o loop com limpeza.

## Tipos de trabalho

O agente trata qualquer `tipo` da fila da mesma forma (grava JSON). Tipos
atuais no produto:

| tipo | Descrição |
|------|-----------|
| `etiqueta_validade` | Etiqueta de validade (estoque) |
| `comprovante_pedido` | Comprovante do pedido |
| `comprovante_praca` | Comprovante de praça (cozinha) |
| `comprovante_expedicao` | Comprovante de expedição |
| `fechamento_caixa` | Fechamento de caixa |

A renderização ESC/POS / driver da impressora fica a cargo da instalação
local (este CLI só entrega o payload em disco e reporta status).

## Contrato completo da API

Ver `docs/AGENTE-LOCAL.md` na raiz do repositório.
