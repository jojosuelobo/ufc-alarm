"use client";

import ErrorState from "@/components/ErrorState";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message="Não foi possível carregar os eventos. Tente novamente."
      onRetry={reset}
    />
  );
}
