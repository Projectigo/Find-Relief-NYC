import { useMemo, useState } from "react";

const LANGUAGES = [
  { code: "en", native: "English", label: "English" },
  { code: "es", native: "Español", label: "Spanish" },
  { code: "zh-CN", native: "中文", label: "Chinese" },
  { code: "ru", native: "Русский", label: "Russian" },
  { code: "ht", native: "Kreyòl Ayisyen", label: "Haitian Creole" },
  { code: "bn", native: "বাংলা", label: "Bengali" },
  { code: "yi", native: "יידיש", label: "Yiddish" },
  { code: "fr", native: "Français", label: "French" },
  { code: "ko", native: "한국어", label: "Korean" },
  { code: "ar", native: "العربية", label: "Arabic" },
  { code: "ur", native: "اردو", label: "Urdu" },
  { code: "pl", native: "Polski", label: "Polish" },
  { code: "pt", native: "Português", label: "Portuguese" },
  { code: "it", native: "Italiano", label: "Italian" },
  { code: "ja", native: "日本語", label: "Japanese" },
];

export default function LanguageControl() {
  const [open, setOpen] = useState(false);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href.split("#")[0];
  }, []);

  function translate(code) {
    setOpen(false);

    if (code === "en") {
      window.location.href = pageUrl;
      return;
    }

    const translateUrl =
      `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(code)}` +
      `&u=${encodeURIComponent(pageUrl)}`;

    window.open(translateUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="language-control">
      <button
        type="button"
        className="language-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span aria-hidden="true">🌐</span>
        <span>Language</span>
      </button>

      {open && (
        <div className="language-menu" role="menu" aria-label="Choose a language">
          <div className="language-menu-head">
            <strong>Choose a language</strong>
            <span>Translation opens in a new tab</span>
          </div>

          <div className="language-grid">
            {LANGUAGES.map((language) => (
              <button
                type="button"
                key={language.code}
                role="menuitem"
                onClick={() => translate(language.code)}
              >
                <strong>{language.native}</strong>
                <small>{language.label}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
