import { useEffect, useMemo, useState } from "react";

const LANGUAGES = [
  { code: "en", native: "English", label: "English" },
  { code: "es", native: "Español", label: "Spanish", prompt: "¿Prefieres español?" },
  { code: "zh-CN", native: "中文", label: "Chinese", prompt: "想看中文吗？" },
  { code: "ru", native: "Русский", label: "Russian", prompt: "Предпочитаете русский?" },
  { code: "ht", native: "Kreyòl Ayisyen", label: "Haitian Creole", prompt: "Ou pito Kreyòl Ayisyen?" },
  { code: "bn", native: "বাংলা", label: "Bengali", prompt: "বাংলায় দেখতে চান?" },
  { code: "yi", native: "יידיש", label: "Yiddish" },
  { code: "fr", native: "Français", label: "French", prompt: "Vous préférez le français ?" },
  { code: "ko", native: "한국어", label: "Korean", prompt: "한국어로 보시겠어요?" },
  { code: "ar", native: "العربية", label: "Arabic" },
  { code: "ur", native: "اردو", label: "Urdu" },
  { code: "pl", native: "Polski", label: "Polish" },
  { code: "pt", native: "Português", label: "Portuguese" },
  { code: "it", native: "Italiano", label: "Italian" },
  { code: "ja", native: "日本語", label: "Japanese" },
];

export default function LanguageControl() {
  const [open, setOpen] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const detected = useMemo(() => {
    const browserCode = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
    if (!browserCode || browserCode.startsWith("en")) return null;
    return LANGUAGES.find((language) => {
      const code = language.code.toLowerCase();
      const base = code.split("-")[0];
      return browserCode === code || browserCode.startsWith(`${base}-`) || browserCode === base;
    });
  }, []);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("find-relief-language-hint-dismissed") === "1";
    if (!dismissed && detected) {
      const timer = window.setTimeout(() => setShowHint(true), 1100);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [detected]);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.filter((language) => language.code !== "en")
            .map((language) => language.code)
            .join(","),
          autoDisplay: false,
        },
        "google_translate_element"
      );
      setGoogleReady(true);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onerror = () => setGoogleReady(false);
      document.body.appendChild(script);
    }
  }, []);

  function dismissHint() {
    setShowHint(false);
    sessionStorage.setItem("find-relief-language-hint-dismissed", "1");
  }

  function translate(code) {
    dismissHint();
    setOpen(false);

    if (code === "en") {
      document.cookie = "googtrans=/en/en; path=/;";
      document.cookie = "googtrans=/en/en; path=/; domain=" + window.location.hostname;
      window.location.reload();
      return;
    }

    const combo = document.querySelector(".goog-te-combo");
    if (googleReady && combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    const pageUrl = window.location.href;
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(pageUrl)}`;
    window.open(translateUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="language-control">
      <div id="google_translate_element" className="google-translate-mount" aria-hidden="true" />

      <button
        type="button"
        className="language-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span aria-hidden="true">🌐</span>
        <span>Language</span>
      </button>

      {open && (
        <div className="language-menu">
          <div className="language-menu-head">
            <strong>Choose a language</strong>
            <span>Powered by Google Translate</span>
          </div>
          <div className="language-grid">
            {LANGUAGES.map((language) => (
              <button type="button" key={language.code} onClick={() => translate(language.code)}>
                <strong>{language.native}</strong>
                <small>{language.label}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {showHint && detected && (
        <div className="language-hint" role="status">
          <button type="button" className="language-hint-main" onClick={() => translate(detected.code)}>
            <span className="language-hint-orb">🌐</span>
            <span>
              <strong>{detected.prompt || `Translate to ${detected.native}?`}</strong>
              <small>Translate page →</small>
            </span>
          </button>
          <button type="button" className="language-hint-close" onClick={dismissHint} aria-label="Dismiss translation suggestion">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
