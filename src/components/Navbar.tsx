import { Link, useLocation } from "react-router-dom";
import {
  Moon, Sun, ChevronDown, User, Globe, Search,
  ShoppingBag, LogOut, LayoutDashboard, X,
  Microscope, Layers, Trophy, Target, Sparkles, Atom,
} from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations, phase1T, type Language } from "@/store/i18nStore";
import { useCartStore } from "@/store/cartStore";
import { useNavStore } from "@/store/navStore";

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex flex-col items-start leading-none group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[1.05rem] md:text-[1.3rem] font-light tracking-[0.12em] text-gray-900 dark:text-white transition-colors group-hover:text-[#947E5C] dark:group-hover:text-[#D4AF37]"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.14em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.48rem] md:text-[0.58rem] font-medium uppercase tracking-[0.35em] text-[#947E5C] dark:text-[#D4AF37] mt-[-2px]"
        style={{ letterSpacing: "0.4em" }}
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
    return <img src={avatar} alt={initials} className={`${dim} rounded-full object-cover border border-[#947E5C] dark:border-[#D4AF37]`} />;
  }
  return (
    <span className={`${dim} rounded-full flex items-center justify-center font-bold border border-[#947E5C] dark:border-[#D4AF37] text-[#947E5C] dark:text-[#D4AF37] bg-white dark:bg-[#111]`}>
      {initials}
    </span>
  );
}


// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [kMaskOpen,    setKMaskOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);
  const { mobileMenuOpen, closeMobileMenu } = useNavStore();

  const { isLoggedIn, userProfile, logout } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const t  = translations[language as "en" | "de"] ?? translations.en;
  const p1 = phase1T[language] ?? phase1T.de;
  const cartCount = useCartStore((s) => s.totalItems());
  const location  = useLocation();

  const redirectParam = encodeURIComponent(location.pathname);
  const loginUrl  = `/login?redirect=${redirectParam}`;

  const kMaskRef    = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langRef     = useRef<HTMLDivElement>(null);
  // Close dropdowns on outside click
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (kMaskRef.current    && !kMaskRef.current.contains(e.target as Node))    setKMaskOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langRef.current     && !langRef.current.contains(e.target as Node))     setLangOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Close drawer on route change
  useEffect(() => { closeMobileMenu(); }, [location.pathname]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const LANG_OPTIONS: { code: Language; label: string; native: string }[] = [
    { code: "de", label: "DE", native: "Deutsch"  },
    { code: "en", label: "EN", native: "English"  },
    { code: "ko", label: "KO", native: "한국어"    },
  ];
  const langLabel = LANG_OPTIONS.find((l) => l.code === language)?.label ?? "DE";

  // Shared link style
  const navLink =
    "px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap";

  return (
    <>
      {/* ── Main bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200/70 dark:border-white/[0.06] bg-white/85 dark:bg-black/85 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex w-full items-center h-16 px-4 md:px-8 lg:px-12">

          {/* Logo — centered on mobile, left on desktop */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:mr-8">
            <Logo />
          </div>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex flex-1 items-center gap-0">
            <Link to="/diagnosis" className={navLink}>{p1.nav.hautAnalyse}</Link>

            {/* K-Mask Lab dropdown */}
            <div className="relative" ref={kMaskRef}>
              <button
                onClick={() => setKMaskOpen(!kMaskOpen)}
                className={`${navLink} flex items-center gap-1`}
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
                      ["augen",   p1.nav.kMask.augen],
                      ["vLinie",  p1.nav.kMask.vLinie],
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

            <Link to="/diagnosis" className={navLink}>{p1.nav.routinenSets}</Link>
            <Link to="/diagnosis" className={navLink}>{p1.nav.hautbeduerfnisse}</Link>
            <Link to="/diagnosis" className={navLink}>{p1.nav.bestseller}</Link>
            <Link to="/diagnosis" className={navLink}>{p1.nav.science}</Link>
          </div>

          {/* ── Right icon cluster ── */}
          <div className="ml-auto flex items-center gap-1">
            {/* Search (all screens) */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" aria-label="Search">
              <Search className="h-[1.1rem] w-[1.1rem]" />
            </button>

            {/* Theme toggle (desktop only) */}
            <motion.button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>

            {/* Globe — language dropdown (desktop only) */}
            <div className="hidden md:block relative" ref={langRef}>
              <motion.button
                onClick={() => setLangOpen(!langOpen)}
                className="flex h-9 items-center gap-1 px-2.5 rounded-full border border-stone-200 dark:border-white/15 text-[#947E5C] dark:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors text-[0.68rem] font-medium tracking-wide"
                whileTap={{ scale: 0.95 }}
                aria-label="Change language"
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
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          language === code
                            ? "bg-stone-50 dark:bg-white/5 font-medium"
                            : "hover:bg-stone-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="text-gray-800 dark:text-gray-200">{native}</span>
                        <span
                          className="text-[0.65rem] font-medium"
                          style={{ color: language === code ? "#D4AF37" : "#9a9a9a" }}
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
                className="hidden md:flex items-center rounded-full border border-stone-200 dark:border-white/15 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-[#D4AF37]/50 hover:text-gray-900 dark:hover:text-white transition-colors ml-1"
              >
                {p1.nav.signIn}
              </Link>
            )}

            {/* Cart (all screens) */}
            <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[0.6rem] font-bold text-[#0a0a0a]">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>

        </div>
      </nav>

      {/* ── Mobile Drawer (Categories) ── */}
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
                <Logo />
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

                {/* ── SKIN LAB ── */}
                <p className="px-6 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  Skin Lab
                </p>
                {([
                  { Icon: Microscope, label: p1.nav.hautAnalyse,  href: "/diagnosis" },
                  { Icon: Layers,     label: p1.nav.routinenSets, href: "/diagnosis" },
                ] as { Icon: React.ElementType; label: string; href: string }[]).map(({ Icon, label, href }) => (
                  <Link key={label} to={href}
                    className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#947E5C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors" strokeWidth={1.5} />
                    <span className="text-sm font-medium tracking-wide">{label}</span>
                  </Link>
                ))}

                <div className="mx-6 my-2 border-t border-stone-100 dark:border-white/[0.06]" />

                {/* ── SHOP ── */}
                <p className="px-6 mt-3 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  Shop
                </p>
                {([
                  { Icon: Trophy,   label: p1.nav.bestseller,       href: "/diagnosis" },
                  { Icon: Target,   label: p1.nav.hautbeduerfnisse, href: "/diagnosis" },
                  { Icon: Sparkles, label: p1.nav.kMaskLab,         href: "/diagnosis" },
                ] as { Icon: React.ElementType; label: string; href: string }[]).map(({ Icon, label, href }) => (
                  <Link key={label} to={href}
                    className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#947E5C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors" strokeWidth={1.5} />
                    <span className="text-sm font-medium tracking-wide">{label}</span>
                  </Link>
                ))}

                <div className="mx-6 my-2 border-t border-stone-100 dark:border-white/[0.06]" />

                {/* ── KNOWLEDGE ── */}
                <p className="px-6 mt-3 mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  Knowledge
                </p>
                <Link to="/diagnosis"
                  className="flex items-center gap-4 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors group"
                >
                  <Atom className="h-[1.05rem] w-[1.05rem] shrink-0 text-[#947E5C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] transition-colors" strokeWidth={1.5} />
                  <span className="text-sm font-medium tracking-wide">{p1.nav.science}</span>
                </Link>
              </nav>

              {/* ── Settings ── */}
              <div className="border-t border-stone-100 dark:border-white/[0.07] flex-shrink-0">
                <p className="px-6 pt-5 pb-3 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  Settings
                </p>

                {/* Language */}
                <div className="px-6 pb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Globe className="h-3.5 w-3.5" /> Language
                  </span>
                  <div className="flex gap-1.5">
                    {(["de", "en", "ko"] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`w-9 py-1 rounded-full text-[0.65rem] font-semibold border transition-all ${
                          language === lang
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#947E5C] dark:text-[#D4AF37]"
                            : "border-stone-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:border-[#D4AF37]/40"
                        }`}
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
                      { val: "light", label: "White", Icon: Sun },
                      { val: "dark",  label: "Dark",  Icon: Moon },
                    ] as { val: string; label: string; Icon: React.ElementType }[]).map(({ val, label, Icon }) => (
                      <button
                        key={val}
                        onClick={() => setTheme(val)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold border transition-all ${
                          (val === "dark" ? theme === "dark" : theme !== "dark")
                            ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#947E5C] dark:text-[#D4AF37]"
                            : "border-stone-200 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:border-[#D4AF37]/40"
                        }`}
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
                      <AvatarCircle avatar={userProfile.avatar} firstName={userProfile.firstName} lastName={userProfile.lastName} size="sm" />
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
                      className="flex w-full items-center justify-center rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:opacity-90 transition-opacity"
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
    </>
  );
};

export default Navbar;
