# UFC Alarm

App em Next.js (App Router + TypeScript + Tailwind CSS) que mostra os próximos
eventos de UFC, o card de lutas de cada evento, e um botão de notificação por
luta. Nesta fase (MVP), o botão de sino apenas abre um modal "Em construção" —
a lógica real de alarme/push ainda não foi implementada.

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.local.example` para `.env.local` e preencha sua chave da
   [Cito API](https://citoapi.com/ufc-api/):

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   CITO_API_KEY=sua-chave-aqui
   ```

   A chave é usada apenas no servidor (dentro de `lib/api/citoClient.ts`) e
   nunca é exposta ao navegador.

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
/app
  page.tsx                 -- Home: próximo evento + countdown + card completo
  eventos/page.tsx         -- lista de eventos futuros, agrupada por período
  eventos/[slug]/page.tsx  -- detalhe de um evento específico
  api/events/...           -- route handlers que expõem os mesmos dados via HTTP

/components                -- componentes de UI (cards, countdown, modal, nav, etc.)
/lib/api                   -- cliente da Cito API e mapeamento para os tipos do app
/lib/dates.ts, format.ts   -- helpers de data/agrupamento e formatação
/types                     -- tipos TypeScript (cito.ts = shape cru da API, domain.ts = tipos usados pela UI)
```

## Sobre os dados da Cito API

Os endpoints usados foram testados diretamente antes da implementação. Alguns
pontos importantes:

- O parâmetro `hasStats=true` filtra eventos **já realizados** (com
  estatísticas pós-luta), não eventos futuros — por isso não é usado para
  montar a lista de "próximos eventos". O filtro correto é
  `status === "scheduled"`.
- O endpoint `GET /ufc/events/{slug}/stats` já retorna tudo que a UI precisa
  por luta: nome e foto do lutador, recorde, país e bandeira (emoji, já
  pronto pela API). Por isso os endpoints `/ufc/fighters/{slug}` e
  `/ufc/bouts/{boutId}/stats` não são usados neste MVP.
- **Odds**: a estrutura existe na API (`odds.red` / `odds.blue`), mas veio
  `null` em todos os eventos testados. O componente `FightCard` só renderiza
  odds quando ambos os valores estiverem presentes — na prática, isso
  raramente vai aparecer.
- A cota da free tier da Cito API é de 500 requisições/mês; por isso as
  páginas usam `revalidate` de 30–60 minutos em vez de buscar dados a cada
  acesso.

## Fora de escopo (por enquanto)

Notificações/push reais, favoritar lutas, login/autenticação, estatísticas
round a round, resultados de eventos passados.
