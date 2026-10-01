import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 pt-24 text-center">
      <p className="font-heading text-2xl uppercase tracking-tight">
        Página não encontrada
      </p>
      <p className="text-sm text-muted">
        A página que você tentou acessar não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-md bg-accent px-5 py-2 font-heading uppercase tracking-wide text-white"
      >
        Voltar para página principal
      </Link>
    </div>
  );
}
