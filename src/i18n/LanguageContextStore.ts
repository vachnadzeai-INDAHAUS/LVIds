import { createContext } from "react";
import type { Language } from "./translations";

export type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
