# Agente Local de Impressão

Contrato técnico da API consultada pelo agente instalado no computador
conectado à impressora térmica. A implementação de referência em Node
está em **`agents/impressao/`** (CLI `chef-hub-agente`).

## Fluxo

```
Chef Hub Web  →  fila_impressao (Supabase)  →  Agente Local  →  Impressora Térmica
```

1. O usuário emite uma etiqueta (`/estoque/etiquetas`) ou o sistema enfileira
   um comprovante (pedido, praça, expedição, fechamento de caixa) — isso
   cria um trabalho em `fila_impressao` com `status = 'pendente'`.
2. O agente local faz *polling* periódico (ex: a cada 5s) em
   `GET /api/agente-impressao/trabalhos`.
3. O **GET já claima** os trabalhos: o servidor marca como `processando` e
   devolve apenas os claimados. O agente **não** precisa enviar
   `PATCH { "status": "processando" }` antes de processar.
4. Para cada trabalho retornado, o agente:
   - renderiza / grava o `payload` (a referência em `agents/impressao/`
     escreve `./outbox/{id}.json`);
   - marca como `concluido` ou `erro` (com `erroMensagem`) via
     `PATCH /api/agente-impressao/trabalhos/{id}`.

## Autenticação

O agente **não** usa login de usuário (Supabase Auth) — ele é um processo
headless, sem sessão de navegador. Autentica com uma **chave de API própria**
por agente, gerada uma única vez na tela "Etiquetas de validade" (botão
"Novo agente") e enviada como `Authorization: Bearer <chave>` em toda
requisição.

- A chave em texto puro só existe no momento da criação — o banco guarda
  só o hash SHA-256 (`agentes_impressao.chave_api_hash`). Se perdida, é
  preciso criar um novo agente.
- As Route Handlers do agente (`src/app/api/agente-impressao/**`) rodam
  com o client **service-role** do Supabase (bypassa RLS) e fazem a
  checagem manual de posse (`empresa_id` do trabalho == `empresa_id` do
  agente autenticado) — ver `src/features/etiquetas/agente-auth.ts`.

## Endpoints

### `GET /api/agente-impressao/trabalhos`

Retorna até 20 trabalhos **já claimados como `processando`** da empresa do
agente autenticado (antes estavam `pendente`), mais antigos primeiro.

```json
{
  "trabalhos": [
    {
      "id": "uuid",
      "tipo": "etiqueta_validade",
      "payload": {
        "produto": "Filé de frango",
        "loteNumero": "L-2026-001",
        "dataValidade": "2026-07-25",
        "dataProducao": "2026-07-18T10:00:00Z",
        "tamanho": "50x30",
        "quantidadeEtiquetas": 3
      },
      "status": "processando",
      "tentativas": 0,
      "criado_em": "2026-07-18T10:05:00Z"
    }
  ]
}
```

Tipos de `tipo` aceitos na fila:

- `etiqueta_validade`
- `comprovante_pedido`
- `comprovante_praca`
- `comprovante_expedicao`
- `fechamento_caixa`

### `PATCH /api/agente-impressao/trabalhos/{id}`

Ao finalizar:

```json
{ "status": "concluido" }
```

ou, em caso de falha (impressora offline, papel, etc.):

```json
{ "status": "erro", "erroMensagem": "Impressora não encontrada na porta USB001" }
```

`status` aceita `"processando" | "concluido" | "erro"`. Como o GET já
claima, o caminho normal do agente é só `concluido` / `erro`. O agente
nunca volta um trabalho para `"pendente"` — se falhar, fica `"erro"` e cabe
ao usuário reemitir pela web.

## Estados de um trabalho

```
pendente → processando → concluido
                       → erro
```

(O salto `pendente → processando` é feito pelo próprio `GET`.)

## Implementação de referência

Ver `agents/impressao/README.md`:

- Variáveis: `CHEF_HUB_BASE_URL`, `CHEF_HUB_API_KEY`
- Binário npm: `chef-hub-agente`
- Outbox local: `agents/impressao/outbox/{id}.json`

Ainda fora do escopo do CLI de referência (fica na instalação Windows):

- Descoberta/configuração da impressora térmica local (driver, porta,
  ESC/POS).
- Renderização do layout físico a partir do `payload`.
- Retentativa automática / instalador como serviço no boot.
