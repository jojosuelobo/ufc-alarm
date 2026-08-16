/** "Light Heavyweight Bout" -> "Light Heavyweight" */
export function formatWeightClass(weightClass?: string): string | undefined {
  return weightClass?.replace(/\s*Bout$/i, "");
}

/** "Magomed Ankalaev" -> "MA" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const METHOD_TRANSLATIONS: Record<string, string> = {
  "ko/tko": "Nocaute",
  submission: "Finalização",
  "decision - unanimous": "Decisão Unânime",
  "decision - split": "Decisão Dividida",
  "decision - majority": "Decisão Majoritária",
  dq: "Desqualificação",
  "no contest": "Sem Resultado",
};

/** Cito returns fight-ending methods in English ("KO/TKO", "Decision -
 * Unanimous", ...) — map the ones we've seen to pt-BR; anything unrecognized
 * passes through unchanged rather than disappearing. */
export function translateMethod(method: string | null | undefined): string | null {
  if (!method) return null;
  return METHOD_TRANSLATIONS[method.toLowerCase()] ?? method;
}
