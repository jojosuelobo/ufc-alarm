import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { getActiveAlarmsForUser } from "@/lib/alarms/queries";
import ProfileForm from "@/components/account/ProfileForm";
import AlarmList from "@/components/account/AlarmList";
import ExtraEventsToggle from "@/components/account/ExtraEventsToggle";
import NotificationChannelToggle from "@/components/account/NotificationChannelToggle";
import DiscordWebhookForm from "@/components/account/DiscordWebhookForm";
import PhoneForm from "@/components/account/PhoneForm";

export default async function MinhaContaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirectTo=/minha-conta");
  }

  const alarms = getActiveAlarmsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20 pt-10 sm:px-10 lg:px-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-5xl uppercase tracking-tight sm:text-6xl">
          Minha Conta
        </h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold uppercase tracking-wide text-muted hover:border-accent hover:text-accent"
          >
            Sair
          </button>
        </form>
      </div>

      <section className="mt-10">
        <ProfileForm user={user} />
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <ExtraEventsToggle initialValue={user.showExtraEvents} />
      </section>

      <section className="mt-10 border-t border-border pt-6">
        <p className="mb-4 font-heading text-xl uppercase tracking-wide sm:text-2xl">
          Como você quer ser notificado?
        </p>
        <div className="flex flex-col gap-5">
          <NotificationChannelToggle
            channel="site"
            initialValue={user.notifySite}
            label="Notificação pelo site"
            description="O site pisca e toca um som quando a luta começa."
          />
          <div className="flex flex-col gap-3">
            <NotificationChannelToggle
              channel="whatsapp"
              initialValue={user.notifyWhatsapp}
              label="WhatsApp"
              description="Você recebe uma mensagem no WhatsApp assim que a luta for começar."
              disabled={!user.phone}
              disabledReason="Cadastre um telefone abaixo para ativar o WhatsApp."
            />
            <PhoneForm initialValue={user.phone} />
          </div>
          <div className="flex flex-col gap-3">
            <NotificationChannelToggle
              channel="discord"
              initialValue={user.notifyDiscord}
              label="Discord"
              description="Você recebe uma mensagem no canal do Discord assim que a luta for começar."
              disabled={!user.discordWebhookUrl}
              disabledReason="Cole a URL de um webhook do Discord abaixo para ativar."
            />
            <DiscordWebhookForm
              initialValue={user.discordWebhookUrl}
              initialMentionEveryone={user.discordMentionEveryone}
            />
          </div>
          <NotificationChannelToggle
            channel="telegram"
            initialValue={user.notifyTelegram}
            label="Telegram"
            description="Em breve: receba a notificação direto no Telegram."
          />
        </div>
      </section>

      <section className="mt-14">
        <p className="mb-2 font-heading text-xl uppercase tracking-wide sm:text-2xl">
          Alarmes ativos
        </p>
        <p className="mb-4 text-sm text-muted">
          As notificações ainda não são enviadas de verdade — isso aqui só guarda o alarme
          para quando essa parte estiver pronta.
        </p>
        <AlarmList alarms={alarms} />
      </section>
    </div>
  );
}
