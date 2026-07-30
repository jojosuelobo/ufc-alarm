import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 pt-24 text-center">
      <p className="font-heading text-2xl uppercase tracking-tight">
        Evento não encontrado
      </p>
      <p className="text-sm text-muted">
        Este evento não existe ou ainda não está disponível.
      </p>
      <Link
        href="/eventos"
        className="rounded-md bg-accent px-5 py-2 font-heading uppercase tracking-wide text-white"
      >
        Ver eventos
      </Link>
    </div>
  );
}
