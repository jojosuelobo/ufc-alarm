import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/auth/actions";
import { getActiveAlarmsForUser } from "@/lib/alarms/queries";
import ProfileForm from "@/components/account/ProfileForm";
import AlarmList from "@/components/account/AlarmList";

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
