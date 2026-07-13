import type { AIMode, AIProviderId } from "@/lib/ai/types";

export type AIConfig = {
  enabled: boolean;
  provider: AIProviderId;
  mode: AIMode;
  geminiConfigured: boolean;
  maxFileSizeBytes: number;
  maxFiles: number;
  timeoutMs: number;
};

function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true" || value === "1";
}

function readProvider(value: string | undefined): AIProviderId {
  if (value === "disabled" || value === "gemini" || value === "future") {
    return value;
  }

  return "mock";
}

export function getAIConfig(): AIConfig {
  const enabled = readBoolean(process.env.AI_ENABLED, true);
  const provider = enabled ? readProvider(process.env.AI_PROVIDER) : "disabled";
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const canUseLiveGemini = provider === "gemini" && geminiConfigured;

  return {
    enabled,
    provider,
    mode: !enabled ? "disabled" : canUseLiveGemini ? "live" : "mock",
    geminiConfigured,
    maxFileSizeBytes: 6 * 1024 * 1024,
    maxFiles: 4,
    timeoutMs: 30_000,
  };
}

export function getAISetupMessage(config = getAIConfig()) {
  if (!config.enabled) {
    return "שירות הסריקה אינו זמין כרגע.";
  }

  if (config.provider === "gemini" && !config.geminiConfigured) {
    return "Gemini הוגדר כספק AI, אבל חסר GEMINI_API_KEY.";
  }

  if (config.mode === "mock") {
    return "הסריקה פועלת במצב הדגמה בטוח. לא נשלח מידע לספק AI חיצוני.";
  }

  return "סריקת AI פעילה בצד השרת.";
}
