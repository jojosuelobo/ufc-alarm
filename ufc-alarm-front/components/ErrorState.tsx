"use client";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = "Não foi possível carregar os dados. Tente novamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 pt-24 text-center">
      <p className="font-heading text-2xl uppercase tracking-tight">
        Ops, algo deu errado
      </p>
      <p className="text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-accent px-5 py-2 font-heading uppercase tracking-wide text-white"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
