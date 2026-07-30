"use client";

interface UnderConstructionModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UnderConstructionModal({
  open,
  onClose,
}: UnderConstructionModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-background p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-4xl">🚧</div>
        <h2 className="font-heading text-2xl uppercase tracking-tight">
          Em construção
        </h2>
        <p className="mt-2 text-sm text-muted">
          As notificações estão a caminho. Em breve você vai poder ser
          avisado antes de cada luta.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-md bg-accent py-2 font-heading uppercase tracking-wide text-white"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
