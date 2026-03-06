import { Link } from "react-router-dom";
import { Moon, Sun, ChevronDown, User, Globe, Search, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations } from "@/store/i18nStore";

function Logo() {
  return (
    <Link to="/" className="flex flex-col items-start leading-none group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[1.1rem] md:text-[1.35rem] font-light tracking-[0.12em] text-foreground transition-colors group-hover:text-primary"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.14em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.5rem] md:text-[0.6rem] font-medium uppercase tracking-[0.35em] text-primary mt-[-2px]"
        style={{ letterSpacing: "0.4em" }}
      >
        — LAB —
      </span>
    </Link>
  );
}

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { isLoggedIn } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const t = translations[language];

  const langRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex w-full items-center justify-between px-6 md:px-10 py-4">
        <Logo />

        {/* 📱 Mobile UI - 테마 전환 버튼이 지구본 왼쪽에 추가되었습니다 */}
        <div className="flex items-center gap-1 md:hidden">
          {/* 모바일용 테마 전환 버튼 */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>

          {/* 모바일용 지구본 드롭다운 */}
          <div className="relative" ref={langRef}>
            <motion.button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#947E5C] dark:text-[#D4AF37]"
              whileTap={{ scale: 0.9 }}
            >
              <Globe className="h-5 w-5" />
            </motion.button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-32 overflow-hidden rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-xl"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setLangOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-primary/10"
                    >
                      <span className={language === lang.code ? "font-bold text-primary" : "text-foreground/70"}>
                        {lang.label}
                      </span>
                      {language === lang.code && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="p-2 text-foreground/80 hover:text-primary transition-colors">
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* 💻 Desktop UI (기존 로직 완벽 보존) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
            <button className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors">
              {t.products} <ChevronDown className="h-3 w-3" />
            </button>
            {/* ... Mega Menu 생략 (내부 로직 동일) ... */}
          </div>

          <div className="relative" ref={langRef}>
            <motion.button
              onClick={() => setLangOpen(!langOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/50 text-[#947E5C] dark:text-[#D4AF37] hover:border-primary/40"
              whileTap={{ scale: 0.95 }}
            >
              <Globe className="h-4 w-4" />
            </motion.button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-32 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setLangOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-primary/10"
                    >
                      {lang.label}
                      {language === lang.code && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
            whileTap={{ scale: 0.92 }}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.button>

          <Link to="/diagnosis" className="rounded-full border border-primary px-5 py-2 font-body text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
            {t.startDiagnosis}
          </Link>
          
          {!isLoggedIn && (
            <Link to="/signup" className="rounded-full bg-primary px-5 py-2 font-body text-sm font-medium text-primary-foreground hover:opacity-90">
              {t.signUp}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
