import { Link, useLocation } from "react-router-dom";
import {
  Moon, Sun, ChevronDown, User, Globe, Search,
  ShoppingBag, LogOut, LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations, phase1T, type Language } from "@/store/i18nStore";
import { useCartStore } from "@/store/cartStore";

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex flex-col items-start group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[0.82rem] md:text-[1.00rem] font-light text-gray-900 dark:text-white transition-colors group-hover:text-[var(--ssl-accent-deep)] dark:group-hover:text-[var(--ssl-accent)] leading-none"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "0.07em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.4rem] md:text-[0.70rem] font-medium uppercase text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] mt-[2px] md:mt-[4px] leading-none"
        style={{ letterSpacing: "0.24em" }}
      >
        — LAB —
      </span>
    </Link>
  );
}

// ── Avatar/initials circle ────────────────────────────────────────────────────
function AvatarCircle({
  avatar, firstName, lastName, size = "md",
}: { avatar?: string; firstName: string; lastName: string; size?: "sm" | "md" }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs";
  if (avatar) {
    return <img src={avatar} alt={initials} className={`${dim} rounded-full object-cover border border-[var(--ssl-accent-deep)] dark:border-[var(--ssl-accent)]`} />;
  }
  return (
    <span className={`${dim} rounded-full flex items-center justify-center font-bold border border-[var(--ssl-accent-deep)] dark:border-[var(--ssl-accent)] text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] bg-white dark:bg-[#111]`}>
      {initials}
    </span>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [kMaskOpen, setKMaskOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const { isLoggedIn, userProfile, logout } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const t = translations[language as "en" | "de"] ?? translations.en;
  const p1 = phase1T[language] ?? phase1T.de;
  const cartCount = useCartStore((s) => s.totalItems());
  const location = useLocation();

  const redirectParam = encodeURIComponent(location.pathname);
  const loginUrl = `/login?redirect=${redirectParam}`;

  const kMaskRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (kMaskRef.current && !kMaskRef.current.contains(e.target as Node)) setKMaskOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);



  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const LANG_OPTIONS: { code: Language; label: string; native: string }[] = [
    { code: "de", label: "DE", native: "Deutsch" },
    { code: "en", label: "EN", native: "English" },
    { code: "ko", label: "KO", native: "한국어" },
  ];
  const langLabel = LANG_OPTIONS.find((l) => l.code === language)?.label ?? "DE";

  // Shared link style - 데스크탑 텍스트 메뉴들도 완벽한 수직 정렬이 되도록 flex items-center 추가
  const navLink =
    "flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap";
  const navFont = { fontFamily: "var(--font-sans)" };

  return (
    <>
      {/* ── Main bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b pt-[env(safe-area-inset-top)]" style={{ background: 'var(--ssl-bg)', borderColor: 'var(--ssl-border)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}>
        {/* Mobile: flex with justify-between for logo-left/icons-right; Desktop: flex */}
        <div className="flex md:flex w-full items-center justify-between h-12 md:h-[52px] px-4 md:px-8 lg:px-10">

          {/* Logo — left-aligned on mobile, with flex-none so it doesn't grow */}
          <div className="flex items-center translate-y-[12px] md:translate-y-1.5 md:justify-start md:flex-none md:mr-8">
            <Logo />
          </div>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex flex-1 items-center gap-0">
            <Link to="/diagnosis" className={navLink} style={navFont}>{p1.nav.hautAnalyse}</Link>

            {/* K-Mask Lab dropdown */}
            <div className="relative flex items-center h-full" ref={kMaskRef}>
              <button
                onClick={() => setKMaskOpen(!kMaskOpen)}
                className={`${navLink} gap-1`}
                style={navFont}
              >
                {p1.nav.kMaskLab}
                <motion.span
                  animate={{ rotate: kMaskOpen ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex"
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.span>
              </button>
              <AnimatePresence>
                {kMaskOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="absolute top-full left-0 mt-1 w-44 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl overflow-hidden z-50"
                  >
                    {([
                      ["augen", p1.nav.kMask.augen],
                      ["vLinie", p1.nav.kMask.vLinie],
                      ["gesicht", p1.nav.kMask.gesicht],
                    ] as [string, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setKMaskOpen(false)}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/diagnosis" className={navLink} style={navFont}>{p1.nav.routinenSets}</Link>
            <Link to="/diagnosis" className={navLink} style={navFont}>{p1.nav.hautbeduerfnisse}</Link>
            <Link to="/diagnosis" className={navLink} style={navFont}>{p1.nav.bestseller}</Link>
            <Link to="/diagnosis" className={navLink} style={navFont}>{p1.nav.science}</Link>
          </div>

          {/* ── Right icon cluster ── */}
          {/* 모바일에서는 정확히 76px 너비를 차지하여 좌측 스페이서와 완벽한 대칭을 이룸 */}
          <div className="flex items-center justify-end gap-1 ml-auto">
            {/* Search (all screens) */}
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Search">
              <Search className="h-[1.1rem] w-[1.1rem]" />
            </button>

            {/* Theme toggle (desktop only) */}
            <motion.button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                try {
                  setTheme(next);
                } catch (e) {
                  if (next === "dark") document.documentElement.classList.add("dark");
                  else document.documentElement.classList.remove("dark");
                }
              }}
              className="hidden md:flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle theme"
              translate="no"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>

            {/* Globe — language dropdown (desktop only) */}
            <div className="hidden md:block relative" ref={langRef}>
              <motion.button
                onClick={() => setLangOpen(!langOpen)}
                className="flex h-9 items-center gap-1 px-2.5 rounded-full border border-stone-200 dark:border-white/15 text-[var(--ssl-accent-deep)] dark:text-[var(--ssl-accent)] hover:border-[var(--ssl-accent)]/50 transition-colors text-[0.68rem] font-medium tracking-wide"
                whileTap={{ scale: 0.95 }}
                aria-label="Change language"
                style={navFont}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                {langLabel}
                <motion.span
                  animate={{ rotate: langOpen ? 180 : 0 }}
                  transition={{ duration: 0.18 }}
                  className="inline-flex"
                >
                  <ChevronDown className="h-3 w-3" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-1 w-36 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl overflow-hidden z-50"
                  >
                    {LANG_OPTIONS.map(({ code, label, native }) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code); setLangOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${language === code
                          ? "bg-stone-50 dark:bg-white/5 font-medium"
                          : "hover:bg-stone-50 dark:hover:bg-white/5"
                          }`}
                        style={navFont}
                      >
                        <span className="text-gray-800 dark:text-gray-200">{native}</span>
                        <span
                          className="text-[0.65rem] font-medium"
                          style={{ color: language === code ? "var(--ssl-accent)" : "#9a9a9a" }}
                        >
                          {label}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth — desktop */}
            {isLoggedIn && userProfile ? (
              <div className="hidden md:block relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center rounded-full ml-1 focus:outline-none"
                  aria-label="Account menu"
                >
                  <AvatarCircle avatar={userProfile.avatar} firstName={userProfile.firstName} lastName={userProfile.lastName} />
                </motion.button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-48 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-stone-100 dark:border-white/[0.07]">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {userProfile.firstName} {userProfile.lastName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{userProfile.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                        <User className="h-4 w-4" /> {t.profile}
                      </Link>
                      {userProfile.role === "admin" && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/5 transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> {t.admin}
                        </Link>
                      )}
                      <div className="border-t border-stone-100 dark:border-white/[0.07]">
                        <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <LogOut className="h-4 w-4" /> {t.logout}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to={loginUrl}
                className="hidden md:flex items-center rounded-full border border-stone-200 dark:border-white/15 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-[var(--ssl-accent)]/50 hover:text-gray-900 dark:hover:text-white transition-colors ml-1"
              >
                {p1.nav.signIn}
              </Link>
            )}

            {/* Cart (all screens) */}
            <Link to="/cart" className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ssl-accent)] text-[0.6rem] font-bold text-[#F5F5F7]">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>

        </div>
      </nav>
    </>
  );
};

export default Navbar;