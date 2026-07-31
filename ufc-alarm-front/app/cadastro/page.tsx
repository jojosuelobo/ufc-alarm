import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeRedirect } from "@/lib/auth/validation";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage({
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
      <h1 className="font-heading text-4xl uppercase tracking-tight">Criar conta</h1>
      <p className="mt-2 text-base text-muted">
        Só e-mail e senha por enquanto — simples assim.
      </p>
      <div className="mt-8">
        <SignupForm redirectTo={target} />
      </div>
    </div>
  );
}
