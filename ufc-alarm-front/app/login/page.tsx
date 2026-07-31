import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeRedirect } from "@/lib/auth/validation";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;
  const target = safeRedirect(redirectTo);

  const user = await getCurrentUser();
  if (user) {
    redirect(target);
  }

  return (
    <div className="mx-auto max-w-md px-6 pb-20 pt-14 sm:px-10">
      <h1 className="font-heading text-4xl uppercase tracking-tight">Entrar</h1>
      <p className="mt-2 text-base text-muted">
        Entre com seu e-mail e senha para ativar alarmes de luta.
      </p>
      <div className="mt-8">
        <LoginForm redirectTo={target} />
      </div>
    </div>
  );
}
