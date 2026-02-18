import React, { useState, ReactNode } from "react";
import { translations, Language } from "./translations";
import { LanguageContext } from "./LanguageContextStore";

type TranslationNode = string | { [key: string]: TranslationNode };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split(".");
    let value: TranslationNode = translations[language] as TranslationNode;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    if (typeof value === "string" && params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(`{{${paramKey}}}`, String(paramValue));
      }
    }

    return value as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
