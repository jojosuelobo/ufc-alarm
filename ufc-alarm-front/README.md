# UFC Alarm

App em Next.js que mostra os próximos eventos de UFC, o card de lutas de cada
evento, e deixa o usuário marcar lutas específicas para receber um alarme
sonoro **na própria página** no exato momento em que a luta começa — sem
precisar ficar checando o card manualmente.

Visual editorial no estilo do site oficial do UFC (fundo claro, tipografia
condensada em caixa alta, vermelho como cor de destaque), dados reais vindos
da [Cito API](https://citoapi.com/ufc-api/) através do `ufc-alarm-middleware`
(serviço irmão neste monorepo, ver `../ufc-alarm-middleware/README.md`), com
conta de usuário e alarmes persistidos num banco SQLite local — tudo rodando
dentro do próprio app Next.js, sem backend separado além do middleware.

## Funcionalidades

- **Próximo evento**: a Home mostra o evento mais próximo com countdown ao
  vivo, luta principal em destaque e o card completo (principal +
  preliminares).
- **Lista de eventos**: aba "Eventos" com os próximos cards agrupados por
  período ("Esta semana", "Agosto", etc.), cada linha já mostra as fotos dos
  dois lutadores da luta principal daquele evento.
- **Conta de usuário**: cadastro/login simples (e-mail + senha). Em "Minha
  Conta" dá pra editar nome preferido e telefone, e ver os alarmes ativos.
- **Alarme por luta**: cada luta tem um sino. Clicar nele:
  - Se você não estiver logado → pede pra criar conta/entrar.
  - Se estiver logado mas sem telefone salvo → pede pra completar o
    cadastro em Minha Conta (o telefone é o que vai ser usado quando a
    notificação por SMS/push for implementada de fato — ainda não é).
  - Se estiver logado com telefone → ativa/desativa o alarme de verdade
    (fica salvo no banco, aparece em "Minha Conta", some sozinho depois que
    o evento passa).
- **Alarme sonoro ao vivo**: com pelo menos um alarme ativo e a aba aberta,
  o app fica checando em segundo plano se a luta marcada começou. Quando
  começa, toca um som de alarme em loop e mostra um aviso em tela cheia com
  o nome dos lutadores — só para tocando quando o usuário aperta "Parar"
  (não fecha clicando fora nem com Esc, de propósito).

### O que ainda não faz (por enquanto)

Notificação por push/SMS de verdade (o campo telefone existe mas só é usado
como pré-requisito de UI, nada é enviado), funcionar com a aba fechada ou
minimizada por muito tempo, recuperação de senha, verificação de e-mail,
estatísticas round a round, resultados de eventos passados.

## Stack técnica

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (tema claro, tokens de cor em `app/globals.css`)
- **SQLite** via `better-sqlite3` — banco local em `.data/app.db`, sem
  serviço externo
- **jose** (sessão JWT em cookie httpOnly) + **bcryptjs** (hash de senha)
- Áudio do alarme sintetizado com a **Web Audio API** — sem arquivo de som
  externo
- Dados de eventos/lutas via [Cito API](https://citoapi.com/ufc-api/),
  consumida indiretamente através do `ufc-alarm-middleware` — este projeto
  não guarda mais nenhuma chave da Cito

Sem ORM, sem biblioteca de auth pronta, sem backend separado — tudo dentro
deste projeto Next.js, de propósito, para manter simples.

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.local.example` para `.env.local` e preencha:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   # URL do ufc-alarm-middleware (proxy único de créditos da Cito API — ver
   # ../ufc-alarm-middleware/README.md). Este projeto não fala mais com a
   # Cito API diretamente; CITO_API_KEY não existe mais aqui.
   CITO_MIDDLEWARE_URL=http://localhost:3005

   # Chave interna enviada no header x-internal-key ao chamar o middleware.
   # Precisa ser igual ao MIDDLEWARE_INTERNAL_KEY do .env do ufc-alarm-middleware.
   CITO_MIDDLEWARE_INTERNAL_KEY=

   # Segredo usado para assinar o cookie de sessão (JWT). Gere com:
   #   openssl rand -base64 32
   SESSION_SECRET=

   # Opcional, só para desenvolvimento — veja "Testando o alarme ao vivo" abaixo.
   DEV_FORCE_LIVE_ALARM_IDS=
   ```

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra [http://localhost:3000](http://localhost:3000).

Na primeira execução, o banco SQLite (`.data/app.db`) é criado
automaticamente com as tabelas já prontas — não precisa rodar migração
nenhuma na mão.

## Estrutura de pastas

```
/app
  page.tsx                    -- Home: próximo evento + countdown + card completo
  layout.tsx                  -- layout raiz: fontes, header, monta o AlarmWatcher
  login/page.tsx              -- tela de login
  cadastro/page.tsx           -- tela de criação de conta
  minha-conta/page.tsx        -- perfil (nome/telefone) + lista de alarmes ativos
  eventos/page.tsx            -- lista de eventos futuros, agrupada por período
  eventos/[slug]/page.tsx     -- detalhe de um evento específico
  api/events/...              -- route handlers que expõem os dados de eventos via HTTP
  api/live-status/route.ts    -- endpoint pollado pelo navegador p/ saber se algum alarme está ao vivo

/components
  EventCountdown.tsx, EventDetailView.tsx, FightCard.tsx,
  FighterAvatar.tsx, EventListItem.tsx, TopNav.tsx,
  ErrorState.tsx, Skeletons/...        -- UI de eventos/lutas (existente desde o MVP)
  NotificationBellButton.tsx           -- sino de cada luta: gate de login/telefone + toggle de alarme
  PromptModal.tsx                      -- modal genérico "você precisa de X" (login, telefone)
  UserMenuButton.tsx                   -- ícone de perfil no header (sem foto, só ícone)
  AlarmWatcher.tsx                     -- fica pollando /api/live-status enquanto a aba está aberta
  AlarmRingingOverlay.tsx              -- aviso em tela cheia + botão "Parar"
  auth/LoginForm.tsx, auth/SignupForm.tsx
  account/ProfileForm.tsx, account/AlarmList.tsx

/lib
  api/citoClient.ts, api/events.ts     -- cliente do ufc-alarm-middleware (eventos/lutas) + normalização pros tipos do app
  live/citoLiveClient.ts               -- reexport do client "ao vivo" com o guard server-only (ver lib/shared/ abaixo)
  live/alarmLiveStatus.ts              -- decide quais alarmes vale a pena checar e monta a resposta do polling
  shared/citoLiveFetch.ts              -- cliente HTTP do endpoint "ao vivo" do middleware, sem cache local (o TTL/fail-soft
                                           mora no middleware); sem server-only de propósito, é reusado por scripts fora do Next
  auth/session.ts, auth/dal.ts,
  auth/actions.ts, auth/validation.ts  -- sessão (JWT/cookie), leitura do usuário logado, Server Actions de auth
  alarms/queries.ts, alarms/actions.ts,
  alarms/constants.ts                  -- CRUD de alarmes + as janelas de tempo usadas no polling ao vivo
  db.ts                                -- conexão SQLite (singleton) + criação das tabelas
  dates.ts, format.ts                  -- helpers de data/agrupamento e formatação
  audio.ts                             -- som do alarme sintetizado (Web Audio API), sem arquivo externo

/types
  cito.ts     -- tipos que espelham o JSON cru da Cito API
  domain.ts   -- tipos normalizados usados pela UI (UpcomingEvent, Fight, Fighter)

.data/app.db  -- banco SQLite local (gitignored, criado automaticamente)
```

## Como funciona

### Eventos e lutas (via ufc-alarm-middleware)

Este projeto não fala mais com a Cito API diretamente. Todas as chamadas
saem do servidor (`lib/api/citoClient.ts`, com `import "server-only"`) em
direção ao `ufc-alarm-middleware` (`CITO_MIDDLEWARE_URL`, autenticado com o
header `x-internal-key`) — só o middleware conhece a `CITO_API_KEY` de
verdade. As páginas (`app/page.tsx`, `app/eventos/[slug]/page.tsx`) chamam
`lib/api/events.ts` diretamente como Server Components, sem passar pelos
route handlers em `/app/api` (esses existem só como camada HTTP explícita,
caso algo precise buscar do lado do cliente no futuro).

Detalhes descobertos testando a API da Cito de verdade — continuam válidos
porque o middleware apenas repassa a resposta, sem alterar o formato
(documentados também no código, em `lib/api/events.ts`):

- `GET /ufc/events` mistura eventos passados e futuros, mais alguns
  registros de lixo residual. O parâmetro `hasStats=true` filtra eventos
  **já realizados** (com estatísticas pós-luta) — o oposto do que o nome
  sugere. O filtro certo pra "próximos eventos" é `status === "scheduled"`.
  A lista não vem ordenada por data.
- `GET /ufc/events/{slug}/stats` já retorna tudo que a UI precisa por luta —
  foto do lutador, recorde, país, bandeira (emoji, já pronto) — então os
  endpoints `/ufc/fighters/{slug}` e `/ufc/bouts/{boutId}/stats` não são
  usados.
- Odds (`odds.red`/`odds.blue`) existe na estrutura mas vem `null` na
  prática — só renderiza se os dois valores estiverem presentes.
- Cota da free tier da Cito: **500 requisições/mês**, compartilhada por
  **todos** os consumidores (este app web, o worker mobile, etc). Quem
  garante isso hoje é o cache do próprio `ufc-alarm-middleware` (1h para
  eventos, 30min para stats — ver `../ufc-alarm-middleware/README.md`), não
  mais um cache neste projeto. O `revalidate` de 30–60 minutos usado aqui
  nas chamadas `fetch` é só uma camada extra local, redundante com o cache
  do middleware.

### Contas e sessão

Cadastro e login são só e-mail + senha (`lib/auth/actions.ts`, Server
Actions). Senha vira hash com `bcryptjs` antes de ir pro banco. Sessão é um
JWT assinado (`jose`) guardado num cookie httpOnly — `lib/auth/dal.ts`
exporta `getCurrentUser()`, que lê esse cookie e busca o usuário no SQLite
(nunca devolve o hash da senha, só id/e-mail/nome/telefone). Rotas que
precisam de login (ex: `/minha-conta`) chamam `getCurrentUser()` e
redirecionam pra `/login` se vier `null`.

### Alarmes (o toggle do sino)

Cada luta tem um `boutId` (vem da Cito) e cada evento um `slug`. Quando o
usuário clica no sino com conta + telefone, `toggleAlarmAction`
(`lib/alarms/actions.ts`) insere ou remove uma linha na tabela `alarms` —
sempre revalidando no servidor se o usuário está logado e tem telefone
(nunca confia só no que o componente já mostrou na tela). O nome dos
lutadores, categoria de peso e data do evento ficam **copiados** na própria
linha do alarme no momento da criação, então "Minha Conta" nunca precisa
fazer uma chamada extra à Cito só pra listar os alarmes.

### Alarme sonoro ao vivo

Esta é a parte mais elaborada do projeto — vale explicar o fluxo completo:

1. **Descoberta na Cito API**: existe um endpoint `GET
   /ufc/live/events/{slug}` que devolve o status "ao vivo" de cada luta de
   um evento (`tracking[].status`, valor `"live"` quando a luta está
   rolando). O campo que bate com o `boutId` que a gente já guarda é
   `fightMetricId` — **não** o campo `boutId` do mesmo objeto, que vem com
   um prefixo `"ufc-"` diferente.

2. **Cache centralizado no middleware** (`lib/shared/citoLiveFetch.ts` aqui,
   cache de verdade em `ufc-alarm-middleware/src/cito/cache.ts`): como a
   cota da Cito é de só 500 req/mês, esse endpoint não pode ser chamado a
   cada segundo. Esse cache (TTL de 90s, com fail-soft — devolve o último
   valor bom conhecido se a Cito falhar) não vive mais neste projeto: é uma
   única instância do `ufc-alarm-middleware` que atende todos os
   consumidores (este app web, worker mobile, réplicas do front, etc), então
   não importa quantos usuários ou processos estejam checando o mesmo
   evento, só uma chamada à Cito acontece por janela de 90s no total. O
   `citoLiveFetch.ts` deste projeto é só um cliente HTTP fino do middleware,
   sem cache próprio — só retorna `null` se o middleware em si estiver
   inacessível.

3. **Janela de checagem** (`lib/alarms/constants.ts`,
   `lib/live/alarmLiveStatus.ts`): só vale a pena checar a Cito se o alarme
   está dentro de uma janela de 15 minutos antes até 8 horas depois do
   horário do evento — fora disso, a resposta é sempre "não está ao vivo",
   sem gastar nenhuma chamada. Essa mesma janela de 8h também corrige um
   bug que existia antes: alarmes eram apagados assim que o card começava
   (as preliminares), mesmo que a luta marcada (ex: o main event) só fosse
   acontecer horas depois.

4. **Polling do navegador** (`components/AlarmWatcher.tsx`, montado no
   layout raiz, ativo em qualquer página enquanto o usuário está logado): a
   cada 5 segundos chama `GET /api/live-status` (nosso próprio servidor,
   sem custo de cota nenhum) perguntando o status de todos os alarmes do
   usuário. Quando algum vem com `isLive: true` pela primeira vez naquela
   aba, entra numa fila local e dispara o alerta.

5. **O alerta** (`components/AlarmRingingOverlay.tsx` + `lib/audio.ts`):
   som sintetizado via Web Audio API (dois tons alternados em loop — sem
   precisar de nenhum arquivo de áudio) e um aviso vermelho em tela cheia
   com o nome dos lutadores. Só fecha clicando em "Parar" — de propósito,
   não fecha clicando fora nem com Esc. Parar o alarme não apaga a linha do
   banco, só silencia naquela aba; se o usuário tiver duas abas abertas,
   cada uma toca e precisa do próprio "Parar".

**Testando sem esperar um evento ao vivo de verdade:** como a Cito nunca
mais vai reportar um evento passado como "live", existe uma variável de
ambiente `DEV_FORCE_LIVE_ALARM_IDS` (lista de ids de alarme separados por
vírgula) que força esses alarmes a reportarem `isLive: true` sem chamar a
Cito — só funciona fora de produção (`NODE_ENV !== "production"`) e some se
a variável não estiver definida. Passo a passo:

1. Crie uma conta, salve um telefone em Minha Conta, e ative o alarme de
   alguma luta pelo sino.
2. Descubra o id do alarme: `sqlite3 .data/app.db "SELECT id, fighter_red_name, fighter_blue_name FROM alarms;"`
3. Coloque `DEV_FORCE_LIVE_ALARM_IDS=<id>` no `.env.local` e reinicie
   `npm run dev` (variável de ambiente só é lida na inicialização).
4. Deixe a aba aberta em qualquer página — em até uns 5 segundos o aviso
   deve aparecer com som.
5. Remova a variável (ou deixe vazia) e reinicie quando terminar de testar,
   senão aquele alarme fica "tocando" toda vez que a página carregar.

## Banco de dados

SQLite local em `.data/app.db` (gitignored — é dado de runtime, não faz
parte do código). Duas tabelas, criadas automaticamente em `lib/db.ts`:

```sql
CREATE TABLE users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  preferred_name  TEXT,
  phone           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE alarms (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_slug         TEXT NOT NULL,
  bout_id            TEXT NOT NULL,
  event_title        TEXT NOT NULL,
  event_starts_at    TEXT,              -- ISO 8601 UTC, pode ser nulo
  weight_class       TEXT,
  fighter_red_name   TEXT NOT NULL,
  fighter_blue_name  TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, event_slug, bout_id) -- não dá pra duplicar alarme na mesma luta
);
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `CITO_MIDDLEWARE_URL` | Sim | URL do `ufc-alarm-middleware` (ex: `http://localhost:3005`). Este projeto não tem mais `CITO_API_KEY`. |
| `CITO_MIDDLEWARE_INTERNAL_KEY` | Sim | Chave enviada no header `x-internal-key` ao middleware. Deve bater com o `MIDDLEWARE_INTERNAL_KEY` do middleware. |
| `SESSION_SECRET` | Sim | Segredo pra assinar o cookie de sessão. Gere com `openssl rand -base64 32`. |
| `DEV_FORCE_LIVE_ALARM_IDS` | Não | Só em dev — força alarmes específicos a "tocarem" pra testar sem evento ao vivo real. |

## Limitações conhecidas

- O alarme ao vivo só funciona com a aba **aberta**; navegadores limitam
  timers em abas minimizadas/em segundo plano, então a detecção pode
  atrasar nesse caso.
- Sem push/SMS de verdade — o telefone salvo hoje só é um pré-requisito de
  UI, nada é enviado por enquanto.
- O status `"live"` da Cito foi confirmado contra a documentação oficial
  deles, mas ainda não foi observado ao vivo contra uma luta real
  acontecendo — vale acompanhar o primeiro evento real depois de usar essa
  funcionalidade.
