import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, ChevronDown, User, Globe, Search, Check, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useI18nStore, translations } from "@/store/i18nStore";
import { useCartStore } from "@/store/cartStore";

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

// ── Avatar/initials circle ────────────────────────────────────────────────
function AvatarCircle({ avatar, firstName, lastName, size = "md" }: { avatar?: string; firstName: string; lastName: string; size?: "sm" | "md" }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-xs";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={initials}
        className={`${dim} rounded-full object-cover border border-[#947E5C] dark:border-[#D4AF37]`}
      />
    );
  }
  return (
    <span
      className={`${dim} rounded-full flex items-center justify-center font-bold border border-[#947E5C] dark:border-[#D4AF37] text-[#947E5C] dark:text-[#D4AF37] bg-card/80`}
    >
      {initials}
    </span>
  );
}

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { isLoggedIn, userProfile, logout } = useAuthStore();
  const { language, setLanguage } = useI18nStore();
  const t = translations[language];
  const cartCount = useCartStore((s) => s.totalItems());
  const location = useLocation();

  // Preserve current path so auth redirects the user back after login
  const redirectParam = encodeURIComponent(location.pathname);
  const loginUrl = `/login?redirect=${redirectParam}`;
  const signupUrl = `/login?tab=signup&redirect=${redirectParam}`;

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
  ];

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex w-full items-center justify-between px-6 md:px-10 py-4">
        <Logo />

        {/* ── 📱 Mobile UI ── */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Theme toggle */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </motion.button>

          {/* Language dropdown */}
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
                      onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
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

          {/* Mobile auth: avatar when logged in, user icon when logged out */}
          {isLoggedIn && userProfile ? (
            <Link to="/profile" className="flex h-10 w-10 items-center justify-center">
              <AvatarCircle avatar={userProfile.avatar} firstName={userProfile.firstName} lastName={userProfile.lastName} size="sm" />
            </Link>
          ) : (
            <Link to={loginUrl} className="flex h-10 w-10 items-center justify-center text-foreground/70 hover:text-foreground transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-foreground/80" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* ── 💻 Desktop UI ── */}
        <div className="hidden md:flex items-center gap-3">
          {/* Products dropdown */}
          <div className="relative">
            <button className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors">
              {t.products} <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Language dropdown */}
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
                      onClick={() => { setLanguage(lang.code as any); setLangOpen(false); }}
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

          {/* Theme toggle */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
            whileTap={{ scale: 0.92 }}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.button>

          {/* Cart */}
          <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/50 text-foreground/70 hover:border-primary/40 hover:text-foreground transition-colors">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Start Diagnosis */}
          <Link
            to="/diagnosis"
            className="rounded-full border border-primary px-5 py-2 font-body text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {t.startDiagnosis}
          </Link>

          {/* ── Auth area ── */}
          {isLoggedIn && userProfile ? (
            // Logged-in: avatar + dropdown
            <div className="relative" ref={userMenuRef}>
              <motion.button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-full focus:outline-none"
                aria-label="Benutzerkonto"
              >
                <AvatarCircle avatar={userProfile.avatar} firstName={userProfile.firstName} lastName={userProfile.lastName} />
              </motion.button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl z-50"
                  >
                    {/* User name header */}
                    <div className="px-4 py-3 border-b border-border/60">
                      <p className="text-xs font-bold text-foreground truncate">
                        {userProfile.firstName} {userProfile.lastName}
                      </p>
                      <p className="text-xs text-foreground/40 truncate">{userProfile.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      {t.profile}
                    </Link>

                    {userProfile.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {t.admin}
                      </Link>
                    )}

                    <div className="border-t border-border/60 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t.logout}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Logged-out: Login + Sign Up
            <div className="flex items-center gap-2">
              <Link
                to={loginUrl}
                className="rounded-full border border-border px-4 py-2 font-body text-sm font-medium text-foreground/70 hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {t.login}
              </Link>
              <Link
                to={signupUrl}
                className="rounded-full bg-primary px-5 py-2 font-body text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {t.signUp}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
