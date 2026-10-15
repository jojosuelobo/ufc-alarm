import { config } from "./config.js";

function mask(key: string): string {
  return key.length > 4 ? `...${key.slice(-4)}` : "****";
}

async function send(content: string): Promise<void> {
  if (!config.discordWebhookUrl) return;
  try {
    const res = await fetch(config.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      console.error(`Discord webhook retornou ${res.status} ao enviar alerta.`);
    }
  } catch (err) {
    console.error("Falha ao enviar alerta ao Discord:", err);
  }
}

export function notifyKeyBlocked(key: string): void {
  void send(`⚠️ Cito API key **${mask(key)}** estourou a cota (429) e entrou em cooldown.`);
}

export function notifyAllKeysExhausted(): void {
  void send(
    "🚨 @here Todas as Cito API keys estão esgotadas agora. O middleware continua tentando, mas requisições podem falhar até alguma key liberar."
  );
}
