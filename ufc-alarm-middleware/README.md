# ufc-alarm-middleware

Serviço Fastify pequeno cujo único trabalho é ser o **único ponto de toda a
infra do ufc-alarm que fala com a Cito API** (`https://api.citoapi.com`).

## Por que ele existe

A Cito API (`https://citoapi.com/ufc-api/`) tem cota gratuita de **500
requisições/mês**. Antes deste serviço, cada consumidor (o app web
`ufc-alarm-front`, o worker de push mobile, futuros consumidores) chamava a
Cito diretamente e mantinha seu próprio cache — ou seja, N processos, cada um
com seu próprio TTL, todos gastando a mesma cota compartilhada, sem nenhuma
garantia de que a soma ficasse dentro do limite.

O `ufc-alarm-middleware` resolve isso colocando **uma única instância** no
meio: só ela guarda a `CITO_API_KEY` de verdade, só ela fala com
`api.citoapi.com`, e o cache com TTL fica centralizado nela. Não importa
quantos usuários acessem o site, quantas réplicas do front existam, ou
quantos processos diferentes (web, worker mobile, etc.) precisem dos mesmos
dados de evento — o consumo de créditos da Cito depende só de quantas rotas
diferentes (`events`, `event stats`, `live status` por evento) estão sendo
usadas, nunca de quantos consumidores ou usuários finais existem.

Consumidores autenticam com uma chave interna própria (`x-internal-key`),
separada da chave da Cito, e nunca veem `CITO_API_KEY`.

**Consumidores atuais**: `ufc-alarm-front` — tanto o processo web (Next.js,
`lib/api/citoClient.ts` e `lib/shared/citoLiveFetch.ts`) quanto o worker
standalone de push mobile (`scripts/mobile-alarm-worker.ts`).

## Rotas

Todas exigem o header `x-internal-key: <MIDDLEWARE_INTERNAL_KEY>`, exceto `/health`.

| Rota | Espelha (Cito) | TTL | Falha |
|---|---|---|---|
| `GET /api/cito/events?page=&limit=` | `/api/v1/ufc/events` | 1h | 502 |
| `GET /api/cito/events/:slug/stats` | `/api/v1/ufc/events/{slug}/stats` | 30min | 502 |
| `GET /api/cito/live/:slug` | `/api/v1/ufc/live/events/{slug}` | 90s | nunca — 200 com `{data: null}` ou último valor bom conhecido (fail-soft) |
| `GET /health` | — | — | sem auth, usado pelo healthcheck do Docker |

As respostas de `events` e `events/:slug/stats` são repassadas tal como a
Cito devolve (formato `{success, data}`), sem transformação — a normalização
para os tipos do domínio da UI acontece do lado do consumidor
(`ufc-alarm-front`), não aqui.

## Como funciona

### Cache por rota, com TTL independente

Cada rota tem sua própria instância de `TtlCache` (`src/cito/cache.ts`), um
`Map` em memória por chave (página+limite para eventos, slug para stats e
live). Não é compartilhado entre rotas nem persistido — reinicia zerado a
cada deploy/restart. Os TTLs vêm de `src/config.ts`
(`CACHE_TTL_EVENTS_MS`/`CACHE_TTL_EVENT_STATS_MS`/`CACHE_TTL_LIVE_MS`, com os
defaults de 1h/30min/90s da tabela acima).

### Fail-soft só no live status

`events` e `event stats` (`src/routes/events.ts`,
`src/routes/eventStats.ts`) devolvem `502` se a Cito falhar — são chamados
em contexto de página carregando, então um erro explícito é aceitável.

`live status` (`src/routes/liveStatus.ts`) é diferente de propósito: é
chamado por polling curto (a cada poucos segundos, indiretamente, via o
front) enquanto um alarme pode estar prestes a disparar, então nunca deve
quebrar o fluxo do consumidor. Se a Cito falhar, a rota devolve `200` com o
**último valor bom conhecido** daquele slug (`cache.getStale()`, ignora o
TTL) ou `{data: null}` se nunca houve um valor bom. O consumidor sempre
recebe uma resposta bem-formada para tratar.

### Autenticação interna

`src/plugins/internalAuth.ts` registra um hook `onRequest` na instância raiz
do Fastify (não via `app.register`, porque hooks registrados dentro de um
plugin ficam encapsulados só naquele plugin — teria que ser adicionado em
cada rota separadamente). Compara o header `x-internal-key` com
`MIDDLEWARE_INTERNAL_KEY` e responde `401` se não bater, exceto para
`/health`.

## Estrutura de pastas

```
src/
  server.ts                  -- entrypoint: builda o app e sobe o listener
  app.ts                     -- monta a instância Fastify e registra hook de auth + rotas
  config.ts                  -- lê e valida as env vars (lança erro na subida se faltar alguma obrigatória)
  errors.ts                  -- CitoApiError

  cito/
    citoHttpClient.ts        -- fetch cru pra api.citoapi.com com o header x-api-key
    cache.ts                 -- TtlCache genérico (get/getStale/set)
    types.ts                 -- tipos das respostas da Cito (events, event stats, live)

  plugins/
    internalAuth.ts          -- hook onRequest que valida x-internal-key

  routes/
    health.ts       -- GET /health, sem auth
    events.ts       -- GET /api/cito/events, cache 1h, 502 na falha
    eventStats.ts   -- GET /api/cito/events/:slug/stats, cache 30min, 502 na falha
    liveStatus.ts   -- GET /api/cito/live/:slug, cache 90s, fail-soft (nunca falha)
```

## Rodando

```bash
cp .env.example .env   # preencher CITO_API_KEY e MIDDLEWARE_INTERNAL_KEY (openssl rand -hex 32)
npm install
npm run dev             # local, porta 3005 (tsx watch)

# build de produção:
npm run build && npm start

# ou via Docker (build multi-stage, usuário não-root, healthcheck em /health):
docker compose up -d --build
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `CITO_API_KEY` | Sim | Chave da Cito API, enviada no header `x-api-key`. Este é o **único** processo em toda a infra do ufc-alarm que deve conhecer essa chave. |
| `MIDDLEWARE_INTERNAL_KEY` | Sim | Chave que os consumidores (`ufc-alarm-front` web e worker) devem enviar no header `x-internal-key`. Gerar com `openssl rand -hex 32`. |
| `PORT` | Não | Porta do servidor. Default `3005`. |
| `HOST` | Não | Host do listener. Default `0.0.0.0`. |
| `CITO_BASE_URL` | Não | Base da Cito API. Default `https://api.citoapi.com`. |
| `CACHE_TTL_EVENTS_MS` | Não | TTL do cache de `/api/cito/events`, em ms. Default `3600000` (1h). |
| `CACHE_TTL_EVENT_STATS_MS` | Não | TTL do cache de `/api/cito/events/:slug/stats`, em ms. Default `1800000` (30min). |
| `CACHE_TTL_LIVE_MS` | Não | TTL do cache de `/api/cito/live/:slug`, em ms. Default `90000` (90s). |

## Limitações conhecidas

- Cache 100% em memória, por instância — se rodar mais de uma réplica do
  middleware ao mesmo tempo, cada réplica tem seu próprio cache e sua
  própria janela de chamadas à Cito (a garantia de "uma chamada por TTL"
  vale por réplica, não globalmente). Hoje roda como instância única de
  propósito, por causa disso.
- Sem persistência: um restart zera todos os caches, inclusive o último
  valor bom conhecido usado no fail-soft do live status.
- Sem retry nem backoff nas chamadas à Cito — uma falha vira `502`
  (events/stats) ou cai no fail-soft (live) na primeira tentativa.
