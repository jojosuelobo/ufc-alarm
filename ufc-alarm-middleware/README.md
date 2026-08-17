# ufc-alarm-middleware

Único ponto da infra do ufc-alarm que fala com a Cito API (`https://api.citoapi.com`,
cota gratuita de 500 requests/mês). `ufc-alarm-front` (processos `web` e `worker`) e,
no futuro, qualquer outro consumidor, chamam este serviço em vez da Cito diretamente —
assim o consumo de créditos fica atrelado a uma única instância com um único cache,
independente de quantos usuários acessem o site/app ou quantas réplicas do front existam.

## Rotas

Todas exigem o header `x-internal-key: <MIDDLEWARE_INTERNAL_KEY>`, exceto `/health`.

| Rota | Espelha (Cito) | TTL | Falha |
|---|---|---|---|
| `GET /api/cito/events?page=&limit=` | `/api/v1/ufc/events` | 1h | 502 |
| `GET /api/cito/events/:slug/stats` | `/api/v1/ufc/events/{slug}/stats` | 30min | 502 |
| `GET /api/cito/live/:slug` | `/api/v1/ufc/live/events/{slug}` | 90s | nunca — 200 com `{data: null}` ou último valor bom conhecido (fail-soft) |

## Rodando

```bash
cp .env.example .env   # preencher CITO_API_KEY e MIDDLEWARE_INTERNAL_KEY (openssl rand -hex 32)
npm install
npm run dev             # local, porta 3005

# ou via Docker:
docker compose up -d --build
```
