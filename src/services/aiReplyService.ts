/**
 * AI Reply Service — Gemini-powered reply generation.
 *
 * LANGUAGE BEHAVIOR: Reply language is auto-detected from the client
 * message content, NOT from the UI language toggle. A Lithuanian
 * message gets a Lithuanian reply even if the UI is in English.
 */

export type AITone = 'professional' | 'friendly' | 'formal' | 'concise';
export type DetectedLanguage = 'lt' | 'en' | 'unknown';

export interface AIReplyRequest {
  clientMessage: string;
  tone: AITone;
  context?: string;
  maxLength?: 'short' | 'medium' | 'long';
  language?: 'en' | 'lt';           // UI language (fallback only)
}

export interface AIReplyResult {
  success: boolean;
  reply: string;
  detectedLanguage: DetectedLanguage;
  error?: string;
}

// ─── LANGUAGE DETECTION ─────────────────────────────────────────

const LT_CHARS = /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/;
const LT_WORDS = [
  'labas', 'laba', 'diena', 'ačiū', 'dėkoju', 'prašau', 'prašom',
  'sveiki', 'dėl', 'kad', 'yra', 'buvo', 'būtų', 'galiu', 'galite',
  'noriu', 'norėčiau', 'reikia', 'reikėtų', 'pagalba', 'klausimas',
  'sutartis', 'sutarties', 'dokumentai', 'dokumentų', 'sąskaita',
  'mokėjimas', 'mokėjimo', 'problema', 'problemos', 'kaina', 'kainos',
  'nuolaida', 'nuolaidos', 'paslauga', 'paslaugos', 'informacija',
  'atsakymas', 'atsakymą', 'terminas', 'terminą', 'mėnesį', 'savaitę',
  'šiandien', 'rytoj', 'vakar', 'taip', 'arba', 'bet', 'tačiau',
  'nes', 'kai', 'jei', 'kaip', 'kur', 'kas', 'kodėl', 'kiek',
  'darbo', 'įmonė', 'įmonės', 'klientas', 'kliento', 'vadybininkas',
  'gerbiamas', 'gerbiama', 'maloniai', 'gavome', 'gauname', 'siųsti',
  'siųsime', 'atsiprašome', 'patvirtinti', 'patvirtinu', 'užklausa',
  'užklausą', 'pateikti', 'pateikite', 'nurodyti', 'nurodykite',
];
const EN_WORDS = [
  'hello', 'please', 'thank', 'thanks', 'would', 'could', 'should',
  'about', 'have', 'this', 'that', 'with', 'from', 'your', 'will',
  'need', 'want', 'regarding', 'contract', 'document', 'payment',
  'invoice', 'price', 'discount', 'service', 'issue', 'problem',
  'question', 'information', 'deadline', 'when', 'what', 'where',
  'which', 'dear', 'sincerely', 'regards', 'received', 'confirm',
  'update', 'request', 'provide', 'assist', 'resolve',
];

export function detectLanguage(text: string): DetectedLanguage {
  if (!text.trim()) return 'unknown';

  const lower = text.toLowerCase();
  const words = lower.split(/[\s,.!?;:()[\]{}'"—–\-\/\\]+/).filter(w => w.length > 1);

  const ltCharCount = (text.match(new RegExp(LT_CHARS.source, 'g')) || []).length;
  if (ltCharCount >= 3) return 'lt';

  let ltScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (LT_WORDS.includes(word)) ltScore += 2;
    if (EN_WORDS.includes(word)) enScore += 2;
  }

  ltScore += ltCharCount * 3;

  if (ltScore === 0 && enScore === 0) return 'lt';
  if (ltScore > enScore) return 'lt';
  if (enScore > ltScore) return 'en';
  return 'lt';
}

// ─── PUBLIC API ──────────────────────────────────────────────────

export async function generateReply(request: AIReplyRequest): Promise<AIReplyResult> {
  if (!request.clientMessage.trim()) {
    return { success: false, reply: '', detectedLanguage: 'unknown', error: 'empty_input' };
  }

  const detected = detectLanguage(request.clientMessage);
  const replyLang = detected !== 'unknown' ? detected : 'lt';

  try {
    const res = await fetch('/api/ai-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientMessage: request.clientMessage,
        tone: request.tone,
        context: request.context || '',
        maxLength: request.maxLength || 'medium',
        replyLanguage: replyLang,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, reply: '', detectedLanguage: detected, error: data.error || 'Generation failed' };
    }

    const data = await res.json();
    return { success: true, reply: data.reply, detectedLanguage: detected };
  } catch {
    return { success: false, reply: '', detectedLanguage: detected, error: 'Network error — could not reach AI service' };
  }
}
