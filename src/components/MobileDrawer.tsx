// MobileDrawer.tsx — Global mobile categories drawer
// Extracted from Navbar so it works on ALL pages (including /skin-analysis)

import { Link, useLocation } from "react-router-dom";
import {
  Moon, Sun, Globe, X, LogOut,
  Microscope, Layers, Trophy, Target, Sparkles, Atom,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations, phase1T, type Language } from "@/store/i18nStore";
import { useNavStore } from "@/store/navStore";

// ── Logo (duplicated from Navbar to keep this self-contained) ─────────────────
function DrawerLogo() {
  return (
    <Link to="/" className="flex flex-col items-start group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[0.82rem] font-light text-gray-900 dark:text-white leading-none"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.07em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.4rem] font-medium uppercase text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] mt-[2px] leading-none"
        style={{ letterSpacing: "0.24em" }}
      >
        — LAB —
      </span>
    </Link>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function AvatarCircle({ avatar, firstName, lastName }: { avatar?: string; firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  if (avatar) {
    return <img src={avatar} alt={initials} className="h-8 w-8 rounded-full object-cover border border-[var(--ssl-accent-deep)] dark:border-[var(--ssl-accent)]" />;
  }
  return (
    <span className="h-8 w-8 rounded-full flex items-center justify-center font-bold border border-[var(--ssl-accent-deep)] dark:border-[var(--ssl-accent)] text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] bg-white dark:bg-[#111] text-xs">
      {initials}
    </span>
  );
}

export default function MobileDrawer() {
  const { theme, setTheme } = useTheme();
  const { mobileMenuOpen, closeMobileMenu } = useNavStore();
  const { isLoggedIn, userProfile, logout } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const t = translations[language as "en" | "de"] ?? translations.en;
  const p1 = phase1T[language] ?? phase1T.de;
  const location = useLocation();
  const navFont = { fontFamily: "var(--font-sans)" };

  const redirectParam = encodeURIComponent(location.pathname);
  const loginUrl = `/login?redirect=${redirectParam}`;

  // Firefox mobile fix: next-themes updates React state but may not update the DOM
  // class in Firefox iOS. Force-sync the `dark` class on <html> whenever theme changes.
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  // Close drawer on route change
  useEffect(() => { closeMobileMenu(); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
  };

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={closeMobileMenu}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-72 bg-white dark:bg-[#0d0d0d] flex flex-col shadow-2xl md:hidden overflow-hidden"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-stone-100 dark:border-white/[0.07] flex-shrink-0">
              <DrawerLogo />
              <button
                onClick={closeMobileMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ── Nav sections ── */}
            <nav className="flex-1 overflow-y-auto pt-7 pb-7">
              {/* SKIN LAB */}
              <p className="px-6 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--ssl-accent)' }}>
                {language === "ko" ? "스킨 랩" : language === "de" ? "Skin Lab" : "Skin Lab"}
              </p>
              {([
                { Icon: Microscope, label: p1.nav.hautAnalyse, href: "/diagnosis" },
                { Icon: Layers, label: p1.nav.routinenSets, href: "/diagnosis" },
              ] as { Icon: React.ElementType; label: string; href: string }[]).map(({ Icon, label, href }) => (
                <Link key={label} to={href}
                  className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                  style={navFont}
                >
                  <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 transition-colors" style={{ color: 'var(--ssl-accent-muted)' }} strokeWidth={1.5} />
                  <span className="text-sm font-medium tracking-wide">{label}</span>
                </Link>
              ))}

              <div className="mx-6 my-2 border-t border-stone-100 dark:border-white/[0.06]" />

              {/* SHOP */}
              <p className="px-6 mt-3 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--ssl-accent)' }}>
                {language === "ko" ? "쇼핑" : language === "de" ? "Shop" : "Shop"}
              </p>
              {([
                { Icon: Trophy, label: p1.nav.bestseller, href: "/diagnosis" },
                { Icon: Target, label: p1.nav.hautbeduerfnisse, href: "/diagnosis" },
                { Icon: Sparkles, label: p1.nav.kMaskLab, href: "/diagnosis" },
              ] as { Icon: React.ElementType; label: string; href: string }[]).map(({ Icon, label, href }) => (
                <Link key={label} to={href}
                  className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                  style={navFont}
                >
                  <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 transition-colors" style={{ color: 'var(--ssl-accent-muted)' }} strokeWidth={1.5} />
                  <span className="text-sm font-medium tracking-wide">{label}</span>
                </Link>
              ))}

              <div className="mx-6 my-2 border-t border-stone-100 dark:border-white/[0.06]" />

              {/* KNOWLEDGE */}
              <p className="px-6 mt-3 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--ssl-accent)' }}>
                {language === "ko" ? "지식" : language === "de" ? "Wissen" : "Knowledge"}
              </p>
              <Link to="/diagnosis"
                className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                style={navFont}
              >
                <Atom className="h-[1.05rem] w-[1.05rem] shrink-0 transition-colors" style={{ color: 'var(--ssl-accent-muted)' }} strokeWidth={1.5} />
                <span className="text-sm font-medium tracking-wide">{p1.nav.science}</span>
              </Link>
            </nav>

            {/* ── Settings ── */}
            <div className="border-t border-stone-100 dark:border-white/[0.07] flex-shrink-0">
              <p className="px-6 pt-5 pb-3 text-[0.58rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--ssl-accent)' }}>
                {language === "ko" ? "설정" : language === "de" ? "Einstellungen" : "Settings"}
              </p>

              {/* Language */}
              <div className="px-6 pb-3 flex items-center justify-between" style={navFont}>
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Globe className="h-3.5 w-3.5" /> {language === "ko" ? "언어" : language === "de" ? "Sprache" : "Language"}
                </span>
                <div className="flex gap-1.5">
                  {(["de", "en", "ko"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`w-9 py-1 rounded-full text-[0.65rem] font-semibold border transition-all ${language === lang
                        ? ""
                        : "border-stone-200 dark:border-white/10 text-gray-400 dark:text-gray-500"
                        }`}
                      style={language === lang ? { borderColor: 'var(--ssl-accent)', background: 'var(--ssl-accent-bg)', color: 'var(--ssl-accent)' } : undefined}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="px-6 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />} Theme
                </span>
                <div className="flex gap-1.5">
                  {([
                    { val: "light", label: language === "ko" ? "라이트" : language === "de" ? "Hell" : "Light", Icon: Sun },
                    { val: "dark", label: language === "ko" ? "다크" : language === "de" ? "Dunkel" : "Dark", Icon: Moon },
                  ] as { val: string; label: string; Icon: React.ElementType }[]).map(({ val, label, Icon }) => (
                    <button
                      key={val}
                      onClick={() => setTheme(val)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold border transition-all cursor-pointer select-none ${(val === "dark" ? theme === "dark" : theme !== "dark")
                        ? ""
                        : "border-stone-200 dark:border-white/10 text-gray-400 dark:text-gray-500"
                        }`}
                      style={(val === "dark" ? theme === "dark" : theme !== "dark") ? { borderColor: 'var(--ssl-accent)', background: 'var(--ssl-accent-bg)', color: 'var(--ssl-accent)' } : undefined}
                      translate="no"
                    >
                      <Icon className="h-3 w-3" strokeWidth={1.8} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login / User */}
              <div className="px-6 pb-7 pt-1">
                {isLoggedIn && userProfile ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-white/5">
                    <AvatarCircle avatar={userProfile.avatar} firstName={userProfile.firstName} lastName={userProfile.lastName} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{userProfile.firstName}</p>
                      <Link to="/profile" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.profile}</Link>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-500 transition-colors" aria-label="Logout">
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to={loginUrl}
                    className="flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: 'var(--ssl-accent-deep)', color: '#FFFFFF' }}
                  >
                    {p1.nav.signIn}
                  </Link>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
