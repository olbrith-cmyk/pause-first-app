import type { Lang } from "../i18n";

const CHATGPT_BASE_URL = "https://chatgpt.com/g/g-695a7a9e17d08191bd88b76d39f9e54f-pause-firsttm";
const CONSENT_KEY = "pauseFirstAiAssistantConsent";

export function hasAiAssistantConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAiAssistantConsent(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // Ignore — worst case the consent screen shows again next time.
  }
}

export type AiAssistantContext = {
  mainConcern?: string;
  question?: string;
};

// The custom GPT has no way to know the app's language from the URL alone,
// so the language instruction is embedded as the first line of the
// prefilled prompt — GPTs reliably follow an explicit instruction like this
// in the opening message.
export function buildChatGptUrl(lang: Lang, context?: AiAssistantContext): string {
  const parts: string[] = [lang === "da" ? "Svar venligst på dansk." : "Please respond in English."];

  const mainConcern = context?.mainConcern?.trim();
  if (mainConcern) {
    parts.push(lang === "da" ? `Hovedbekymring: ${mainConcern}` : `Main concern: ${mainConcern}`);
  }

  const question = context?.question?.trim();
  if (question) {
    parts.push(lang === "da" ? `Spørgsmål: ${question}` : `Question: ${question}`);
  }

  const prompt = parts.join(" ");
  return `${CHATGPT_BASE_URL}?prompt=${encodeURIComponent(prompt)}`;
}

export function openChatGpt(lang: Lang, context?: AiAssistantContext): void {
  window.open(buildChatGptUrl(lang, context), "_blank");
}
