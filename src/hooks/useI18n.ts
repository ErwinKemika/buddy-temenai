import { useState, useEffect } from "react";
import { type Language, getT } from "@/lib/i18n";

export const LANG_CHANGE_EVENT = "aiyo-language-change";

export function useI18n() {
  const [lang, setLang] = useState<Language>(
    () => (localStorage.getItem("buddy-language") as Language) || "id"
  );

  useEffect(() => {
    const handler = () => {
      setLang((localStorage.getItem("buddy-language") as Language) || "id");
    };
    window.addEventListener(LANG_CHANGE_EVENT, handler);
    return () => window.removeEventListener(LANG_CHANGE_EVENT, handler);
  }, []);

  return { lang, t: getT(lang) };
}
