"use client";

const APK_DOWNLOAD_URL =
  "https://drive.google.com/drive/folders/1jo_cA786u48ONdqiQUOWoHi8UdieACpA?usp=sharing";

export default function MobileAppModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-background p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-heading text-2xl uppercase tracking-tight">
          UFC Alarm no celular
        </h2>
        <p className="mt-2 text-sm text-muted">
          Já temos um app Android com alarmes que tocam mesmo com o celular
          fechado. Ele ainda não está na Play Store — baixe o APK direto e
          instale manualmente (o Android vai pedir para liberar
          &quot;instalar de fontes desconhecidas&quot;).
        </p>
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-md bg-accent py-2 font-heading uppercase tracking-wide text-white"
        >
          Baixar APK
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
