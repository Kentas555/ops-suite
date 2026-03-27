import type { BilingualText } from '../types';
import type { Language } from '../i18n/translations';

/** Normalize a value that might be a plain string or a BilingualText object */
function normalize(text: BilingualText | string | undefined | null): BilingualText {
  if (!text) return { lt: '', en: '' };
  if (typeof text === 'string') return { lt: text, en: text };
  return { lt: text.lt || '', en: text.en || '' };
}

/** Get the text for the current language, falling back to the other language if empty */
export function getText(text: BilingualText | string | undefined | null, lang: Language): string {
  const t = normalize(text);
  const primary = t[lang];
  if (primary) return primary;
  // Fallback to the other language
  return lang === 'lt' ? t.en : t.lt;
}

/** Check if translation is missing for a language */
export function isMissingTranslation(text: BilingualText | string | undefined | null, lang: Language): boolean {
  const t = normalize(text);
  const other: Language = lang === 'lt' ? 'en' : 'lt';
  return !!t[other]?.trim() && !t[lang]?.trim();
}
