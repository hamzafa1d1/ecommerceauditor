'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { translations, type Lang, type Translations } from '@/lib/i18n';

interface LangCtx {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  t: translations.en,
  toggleLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const lang: Lang = 'en';

  return (
    <LangContext.Provider value={{ lang, t: translations.en, toggleLang: () => {} }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
