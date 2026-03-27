import useStore from '../stores/useStore';
import { translations, type Language, type Translations } from './translations';

export function useTranslation() {
  const lang = useStore((s) => s.language);
  const setLang = useStore((s) => s.setLanguage);
  const t = translations[lang];

  return { t, lang, setLang };
}

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}

export type { Language, Translations };
