# UFC Alarm — Mobile (Flutter)

App Android que mostra os próximos eventos de UFC e o card de lutas de cada
evento, e deixa qualquer pessoa marcar lutas específicas para tocar um
alarme no celular **no exato momento em que a luta começa** — sem precisar
criar conta e sem precisar manter o app aberto.

Esse projeto é a versão mobile do [`ufc-alarm-front`](../ufc-alarm-front)
(o app web em Next.js, que fica na pasta irmã dentro deste mesmo repo). Os
dois compartilham o mesmo backend, mas o mobile tem duas diferenças
propositais em relação ao web — explicadas abaixo, porque foi delas que
nasceu boa parte das decisões de arquitetura deste projeto.

## As duas diferenças em relação ao web (e por quê)

### 1. Sem conta de usuário

No web, criar um alarme exige login + telefone salvo (`ufc-alarm-front`
usa `users`/`alarms` no SQLite, sessão JWT em cookie httpOnly). No mobile
isso foi removido de propósito: qualquer um abre o app e já consegue marcar
um alarme, sem cadastro.

Pra isso funcionar sem conta, cada instalação do app gera um **UUID
aleatório na primeira abertura** (`lib/core/device/device_id_service.dart`,
persistido via `shared_preferences`) que funciona como identidade anônima
do aparelho. Esse `deviceId` é o que amarra os alarmes a esse celular — sem
nenhuma informação pessoal envolvida. O backend guarda isso em duas tabelas
novas, **desacopladas** das tabelas `users`/`alarms` do web:

```sql
-- ufc-alarm-front/lib/db.ts
devices        (device_id PK, fcm_token, platform, updated_at)
device_alarms  (id, device_id, event_slug, bout_id, event_title,
                 event_starts_at, weight_class, fighter_red_name,
                 fighter_blue_name, notified_at, created_at)
```

`device_id` não tem nenhuma verificação criptográfica — é só uma string
que o cliente manda em cada request. Isso é uma limitação aceita
conscientemente: em teoria alguém que descobrisse o UUID de outro aparelho
poderia ver/apagar os alarmes dele, mas o UUID não é adivinhável e não tem
nenhum dado sensível atrelado, então o risco é considerado baixo pra esse
projeto.

### 2. O alarme toca mesmo com o app fechado

No web, quem detecta que a luta ficou ao vivo é o **próprio navegador**:
`AlarmWatcher.tsx` fica perguntando pro backend a cada 5s, só funciona com
a aba aberta. Isso não dava pra copiar pro mobile — o requisito era o
alarme tocar mesmo com o app completamente fechado, "como o alarme do
próprio celular".

A solução: inverter quem faz a detecção. Em vez do **app** perguntar pro
backend, é o **backend** que fica de olho e avisa o app quando alguma luta
marcada fica ao vivo, via **push notification (Firebase Cloud
Messaging)**. O Android acorda o app só pra mostrar a notificação, mesmo
que o processo estivesse morto.

```
┌─────────────┐   polling 60s    ┌───────────┐   push (FCM)   ┌──────────────┐
│   worker     │ ───────────────▶│ Cito API   │                │              │
│ (processo    │                  └───────────┘                │  Celular     │
│  Node        │                                                │  (app pode   │
│  separado)   │──────────────── FCM data message ─────────────▶│  estar       │
└──────┬───────┘                                                │  fechado)    │
       │ lê device_alarms                                       └──────────────┘
       │ dentro da janela ao vivo
       ▼
┌───────────────┐
│ SQLite         │
│ (compartilhado │
│  com o web)    │
└───────────────┘
```

Foi cogitado (e descartado) um caminho mais simples: agendar uma
notificação local pro horário estimado do evento, sem precisar de
backend/push. Foi descartado porque os horários de luta **não são
precisos** — lutas do card atrasam ou adiantam dependendo de como a luta
anterior termina, então "agendar pro horário X" tocaria cedo ou tarde
demais na maioria das vezes. O valor real do app é avisar no momento exato
em que a luta *realmente* começa, e isso só dá pra saber consultando a Cito
API em tempo real — por isso a decisão foi manter a mesma lógica de
detecção "ao vivo" que o web já tinha, só que rodando no servidor em vez
do navegador.

## Por que estender o backend do Next.js em vez de criar um serviço novo

O `ufc-alarm-front` já tinha toda a lógica de:
- Buscar e normalizar dados da Cito API (`lib/api/citoClient.ts`,
  `lib/api/events.ts`)
- Detectar quando uma luta específica está ao vivo, com cache de 90s pra
  não estourar a cota de 500 req/mês da Cito
  (`lib/live/citoLiveClient.ts`, `lib/live/alarmLiveStatus.ts`)
- Uma janela de "vale a pena checar": de 15 min antes até 8h depois do
  início do evento (`ALARM_LIVE_WINDOW_PRE_MINUTES` /
  `ALARM_LIVE_WINDOW_POST_HOURS`)

Reescrever tudo isso do zero num serviço separado seria retrabalho e
correria o risco de as duas implementações divergirem com o tempo. A
decisão foi **reaproveitar o máximo possível**, adicionando só o que é
genuinamente novo:

- `GET /api/events` e `GET /api/events/[slug]` (já existiam, já eram
  públicas, sem login) — o app mobile usa **exatamente as mesmas rotas**
  que o web usa pra listar eventos e ver o card de uma luta. Zero mudança
  nelas.
- `app/api/mobile/*` — três rotas novas (`devices`, `alarms`,
  `alarms/[id]`), sem nenhuma leitura de cookie/sessão, só recebendo
  `deviceId` explícito no corpo/query. Ver `ufc-alarm-front/lib/mobile/queries.ts`
  pro CRUD e `app/api/mobile/**/route.ts` pros handlers.
- `scripts/mobile-alarm-worker.ts` — o único componente genuinamente novo
  em termos de infraestrutura: um processo Node **separado** do Next.js
  (rodando via Docker Compose, serviço `worker`), porque uma rota de API
  só executa em resposta a uma requisição — não dá pra hospedar um loop de
  polling permanente dentro do Next.js. Esse processo não pode importar
  `lib/db.ts` nem `lib/live/citoLiveClient.ts` diretamente porque esses
  arquivos têm `import "server-only"` (trava qualquer import fora do
  runtime do Next). Por isso existe uma pequena duplicação deliberada:
  `scripts/lib/citoLiveFetch.ts` é uma cópia enxuta da lógica de busca +
  cache da Cito, e o worker abre sua própria conexão SQLite. As constantes
  de janela (`ALARM_LIVE_WINDOW_*`) *não* são duplicadas — foram extraídas
  pra `lib/shared/alarmWindow.ts`, que não tem o guard `server-only` e por
  isso é importado tanto pelo Next quanto pelo worker.

Documentação completa do lado do backend está no README do
[`ufc-alarm-front`](../ufc-alarm-front/README.md).

## Por que Android só (por enquanto)

iOS foi deixado de fora da v1 de propósito: exige conta de Apple Developer
paga (US$ 99/ano) e, pra ter notificações que tocam som mesmo com o app
fechado (comportamento de "alarme de verdade"), precisa da Apple aprovar
um entitlement especial de *critical alerts* — não é garantido e adiciona
bastante fricção. A arquitetura (backend + FCM) já é compatível com iOS no
futuro; faltaria só a parte de app (certificados, `APNs`, ajustes de
`Info.plist`).

## Como o alarme funciona, passo a passo

1. **1º launch do app**: gera um `deviceId` (UUID) e salva local
   (`shared_preferences`). Pede permissão de notificação (obrigatório a
   partir do Android 13). Pega o token do FCM e registra no backend via
   `POST /api/mobile/devices` (`lib/core/notifications/fcm_service.dart`).
   Esse token é re-sincronizado automaticamente sempre que o FCM troca ele
   (`onTokenRefresh`).

2. **Usuário toca no sino** de uma luta (`NotificationBellButton`, em
   `lib/features/alarms/`) → chama direto `POST /api/mobile/alarms` com o
   `deviceId` e os dados da luta. Sem nenhum gate de login/telefone — é
   criar ou apagar (toggle) na hora. O estado do sino fica sincronizado
   entre a tela de detalhe do evento e "Meus Alarmes" através de um
   provider Riverpod compartilhado (`activeAlarmsProvider`, em
   `lib/providers/alarms_providers.dart`) — mesmo princípio do
   `revalidatePath` que o web usa pros Server Components.

3. **O worker** (`ufc-alarm-front/scripts/mobile-alarm-worker.ts`), rodando
   como processo separado, a cada 60s:
   - Busca no SQLite os `device_alarms` que estão dentro da janela ao vivo
     (15 min antes até 8h depois do `event_starts_at`) e que ainda não
     foram notificados (`notified_at IS NULL`).
   - Agrupa por evento pra não bater na Cito API mais de uma vez pro mesmo
     card.
   - Pra cada evento, consulta o status ao vivo na Cito (com cache de 90s,
     igual o web) e casa o `bout_id` do alarme com o `fightMetricId` que a
     Cito retorna (atenção: **não é o mesmo campo** que o `boutId` da Cito,
     que vem com prefixo `ufc-`).
   - Se a luta está `status === "live"`, manda um push FCM **data-only**
     (sem bloco `notification`) pro token daquele device, e marca
     `notified_at` pra não mandar de novo.
   - Por que data-only: uma mensagem com bloco `notification` faz o
     Android mostrar uma notificação padrão da bandeja sozinho, sem passar
     pelo código do app — e essa notificação padrão não consegue ser
     full-screen nem tocar som em loop. Mandando só `data`, quem decide
     como mostrar é sempre o código Dart do app (`showAlarmNotification`),
     então o comportamento é sempre o mesmo não importa se o app estava
     aberto, em segundo plano ou fechado.

4. **O celular recebe o push** e o Flutter trata de 3 formas, todas
   convergindo pra mesma função (`LocalNotificationsService.showAlarmNotification`,
   em `lib/core/notifications/local_notifications_service.dart`):
   - **App aberto**: `FirebaseMessaging.onMessage` (configurado em
     `fcm_service.dart`) dispara na hora.
   - **App em segundo plano ou fechado**: uma função top-level anotada com
     `@pragma('vm:entry-point')` (`background_handler.dart`) — exigência do
     plugin `firebase_messaging`, porque o Android acorda um isolate novo
     do zero pra rodar só essa função, sem nenhum estado do resto do app.
     Essa função re-inicializa o Firebase e mostra a mesma notificação.
   - Nos dois casos, a notificação é criada com `fullScreenIntent: true`
     (acorda a tela e mostra por cima da tela de bloqueio, como um alarme
     de verdade — exige a permissão `USE_FULL_SCREEN_INTENT` e, a partir do
     Android 14, o usuário liberar isso manualmente também), canal de
     importância máxima, e um botão de ação "Parar".

5. **Usuário toca na notificação** → abre `AlarmRingingOverlay`
   (`lib/features/alarms/alarm_ringing_overlay.dart`): tela cheia
   vermelha, nomes dos lutadores, toca em loop um som de alarme
   (`assets/sounds/alarm_sound.wav` — sintetizado em Python, dois tons
   alternados, o mesmo conceito do `lib/audio.ts` do web que usa Web Audio
   API). Só fecha pelo botão "PARAR" — o botão de voltar do Android é
   interceptado (`PopScope(canPop: false)`) de propósito, mesma ideia do
   web não fechar com Esc/clique fora.

## Estrutura do projeto

```
lib/
  main.dart                      # bootstrap: Firebase (com fallback se
                                  # ainda não configurado), notificações
                                  # locais, navigatorKey global, tabs
  core/
    api/
      api_client.dart            # instância do Dio, baseUrl
      events_api.dart            # GET /api/events, GET /api/events/[slug]
      mobile_alarms_api.dart     # POST devices, GET/POST/DELETE alarms
    device/
      device_id_service.dart     # gera/persiste o UUID do device
    notifications/
      fcm_service.dart           # permissão, token, onMessage
      background_handler.dart    # handler top-level p/ app fechado
      local_notifications_service.dart  # canal Android, show/cancel
    theme/
      app_theme.dart             # cores do globals.css do web, portadas
  models/                        # Fighter, Fight, UpcomingEvent, DeviceAlarm
                                  # (espelham types/domain.ts do web)
  providers/                     # Riverpod: api, device, events, alarms,
                                  # notifications
  features/
    events/
      home_screen.dart           # espelha app/page.tsx
      events_list_screen.dart    # espelha app/eventos/page.tsx
      event_detail_screen.dart   # espelha app/eventos/[slug]/page.tsx
      widgets/
        event_detail_view.dart   # corpo compartilhado entre home e detail
        fight_card.dart          # espelha components/FightCard.tsx
        fighter_avatar.dart      # espelha components/FighterAvatar.tsx
        event_countdown.dart     # espelha components/EventCountdown.tsx
        event_list_item.dart     # espelha components/EventListItem.tsx
    alarms/
      notification_bell_button.dart  # NotificationBellButton.tsx sem
                                      # gate de login/telefone
      my_alarms_screen.dart          # AlarmList.tsx sem campos de conta
      alarm_ringing_overlay.dart     # AlarmRingingOverlay.tsx
  utils/
    dates.dart                   # porta de lib/dates.ts (agrupamento por
                                  # período, "Esta semana", labels em pt-BR)
    format.dart                  # porta de lib/format.ts (initials,
                                  # formatWeightClass)
```

A ideia geral: **cada tela/widget do mobile tem um equivalente no web**, e
os comentários no código apontam de qual arquivo `.tsx` ele foi portado.
Isso é proposital — quem conhece o web consegue se localizar rápido no
mobile, e vice-versa.

## Setup do Firebase (obrigatório pro push funcionar)

Duas credenciais diferentes, pra dois lados diferentes:

1. **`google-services.json`** (identifica o *app Android* pro Firebase) —
   baixa no Firebase Console, projeto → ⚙️ Project Settings → seus apps →
   Android. Vai em `android/app/google-services.json`. Não é segredo (não
   tem chave privada), pode ficar versionado.
2. **Chave de Service Account** (dá permissão pro *backend* mandar pushes
   como admin) — Firebase Console → ⚙️ Project Settings → aba "Service
   accounts" → "Generate new private key". **Essa sim é secreta** — vai em
   `ufc-alarm-front/.secrets/firebase-service-account.json` (gitignored),
   nunca commitada. Ver `FIREBASE_SERVICE_ACCOUNT_PATH` no
   `.env.local.example` do `ufc-alarm-front`.

O Gradle (`android/app/build.gradle.kts`) só aplica o plugin do Google
Services **se o arquivo `google-services.json` existir**:

```kotlin
if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}
```

Isso foi de propósito, pra o projeto continuar buildando mesmo antes do
Firebase estar configurado (útil pra quem for só mexer nas telas, sem
precisar montar um projeto Firebase primeiro). Do lado Dart,
`Firebase.initializeApp()` em `main.dart` está dentro de um try/catch pelo
mesmo motivo: sem Firebase, o app perde só a parte de push — navegação,
lista de eventos e CRUD de alarme continuam funcionando normalmente.

## Rodando localmente

```bash
flutter pub get
flutter analyze   # deve dar "No issues found!"
flutter test      # smoke test do app, com providers mockados (sem rede)
flutter run       # precisa de device/emulador Android conectado
```

O app aponta por padrão pro backend em `http://10.10.10.10:3004`
(`lib/core/api/api_client.dart`, constante `kApiBaseUrl`) — o endereço da
VM onde o `ufc-alarm-front` roda via Docker Compose. Rodando num emulador
Android na própria VM, trocar para `http://10.0.2.2:3004` (alias do
emulador pro host).

## Limitações conhecidas

- **`device_id` sem autenticação real**: qualquer um que descubra o UUID
  de outro aparelho consegue ver/mexer nos alarmes dele. Risco aceito (ver
  seção 1 acima).
- **Full-screen intent no Android 14+**: a permissão especial pode
  precisar ser liberada manualmente pelo usuário nas configurações do
  sistema — não tem como o app garantir 100% que vai tocar em tela cheia
  em todo aparelho/versão.
- **Sem iOS** (ver seção acima).
- **Cota da Cito API**: o worker e o backend web fazem polling
  independentes (processos separados, caches independentes de 90s cada) —
  na prática ainda fica bem dentro do limite de 500 req/mês, mas se um dia
  isso virar um problema, a correção é apontar o worker pra uma rota
  interna do próprio Next.js em vez de bater direto na Cito, unificando o
  cache.
- **Nenhum teste em dispositivo Android real foi feito neste ambiente**
  (a máquina onde o projeto foi desenvolvido não tinha Android SDK/emulador
  disponível) — `flutter analyze`/`flutter test` passam e o worker foi
  validado ponta a ponta contra o Firebase real (com token falso, só pra
  confirmar a autenticação), mas o recebimento de fato da notificação num
  celular ainda precisa ser confirmado manualmente.
