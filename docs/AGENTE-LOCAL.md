# Agente Local de Impressão

Contrato técnico da API consultada pelo agente instalado no computador
Windows conectado à impressora térmica. **O executável do agente NÃO foi
construído nesta sprint** — esta é a especificação para implementá-lo depois.

## Fluxo

```
Chef Hub Web  →  fila_impressao (Supabase)  →  Agente Local (Windows)  →  Impressora Térmica
```

1. O usuário emite uma etiqueta na web (`/estoque/etiquetas`) — isso chama
   `fn_emitir_etiqueta`, que grava um registro em `etiquetas_impressas`
   (histórico) e cria um trabalho em `fila_impressao` com `status = 'pendente'`.
2. O agente local, rodando como processo/serviço no Windows, faz *polling*
   periódico (ex: a cada 5–10s) em `GET /api/agente-impressao/trabalhos`.
3. Para cada trabalho retornado, o agente:
   - marca como `processando` (`PATCH /api/agente-impressao/trabalhos/{id}`);
   - renderiza a etiqueta a partir do `payload` (ver formato abaixo) no
     tamanho indicado e envia para a impressora térmica (ex: via driver
     Windows, ESC/POS, ou biblioteca de impressão térmica — escolha da
     implementação do agente, fora do escopo desta API);
   - marca como `concluido` ou `erro` (com `erroMensagem`) ao final.

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

Retorna até 20 trabalhos pendentes da empresa do agente autenticado, mais
antigos primeiro.

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
      "status": "pendente",
      "tentativas": 0,
      "criado_em": "2026-07-18T10:05:00Z"
    }
  ]
}
```

### `PATCH /api/agente-impressao/trabalhos/{id}`

Corpo:

```json
{ "status": "processando" }
```

ou, ao finalizar:

```json
{ "status": "concluido" }
```

ou, em caso de falha (impressora offline, papel, etc.):

```json
{ "status": "erro", "erroMensagem": "Impressora não encontrada na porta USB001" }
```

`status` aceita `"processando" | "concluido" | "erro"` (o agente nunca
volta um trabalho para `"pendente"` — se falhar, fica `"erro"` e cabe ao
usuário reemitir pela web).

## Estados de um trabalho

```
pendente → processando → concluido
                       → erro
```

## O que fica para uma implementação futura do agente

- Executável/serviço Windows real (linguagem/runtime em aberto — ex: um
  binário .NET ou Node empacotado com `pkg`).
- Descoberta/configuração da impressora térmica local (driver, porta,
  modelo — ESC/POS é o protocolo mais comum nesse tipo de impressora).
- Renderização do layout físico da etiqueta a partir do `payload` (a
  pré-visualização web em `EtiquetaPreview` mostra o layout esperado, mas
  não gera o comando de impressão real).
- Retentativa automática e backoff em caso de erro transitório.
- Instalador e execução como serviço no boot do Windows.
