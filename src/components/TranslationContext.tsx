"use client";

import { createContext, useContext, useEffect, useState } from "react";

type TranslationMap = Record<string, string>;

const TranslationContext = createContext<{
  translations: TranslationMap;
  setTranslations: (t: TranslationMap) => void;
}>({ translations: {}, setTranslations: () => {} });

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [translations, setTranslations] = useState<TranslationMap>({});
  return (
    <TranslationContext.Provider value={{ translations, setTranslations }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  return useContext(TranslationContext);
}

/** Rendered inside an article page to publish sibling slugs into context. */
export function ArticleTranslationSync({ translations }: { translations: TranslationMap }) {
  const { setTranslations } = useTranslationContext();
  useEffect(() => {
    setTranslations(translations);
    return () => setTranslations({});
  }, [translations, setTranslations]);
  return null;
}
