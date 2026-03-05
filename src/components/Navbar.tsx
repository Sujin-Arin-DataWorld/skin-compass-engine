import { Link } from "react-router-dom";
import { Moon, Sun, ChevronDown, User } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";

function Logo() {
  return (
    <Link to="/" className="flex flex-col items-start leading-none group" aria-label="Skin Strategy Lab">
      <span
        className="font-display text-[1.35rem] font-light tracking-[0.12em] text-foreground transition-colors group-hover:text-primary"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "0.14em" }}
      >
        SKIN STRATEGY
      </span>
      <span
        className="font-body text-[0.6rem] font-medium uppercase tracking-[0.35em] text-primary mt-[-2px]"
        style={{ letterSpacing: "0.4em" }}
      >
        — LAB —
      </span>
    </Link>
  );
}

const CONCERNS = ["Sensitivity", "Hydration", "Oily / Pores", "Trouble", "Dead Skin", "Whitening", "Anti-aging"];
const TYPES = ["Cleansing", "Peeling", "Toner / Mist", "Essence / Ampoule", "Cream", "Sun Care"];

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, userProfile } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex w-full items-center justify-between px-6 md:px-10 py-4">
        <Logo />

        <div className="flex items-center gap-3">
          {/* Products Mega-Menu Trigger */}
          <div className="relative hidden md:block" onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
            <button
              className="flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground transition-colors"
            >
              Products <ChevronDown className="h-3 w-3" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-[420px] rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-6"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-primary mb-3">
                        <span className="text-sm">🎯</span> Concern (고민별)
                      </p>
                      <div className="space-y-1.5">
                        {CONCERNS.map((c) => (
                          <button key={c} onClick={() => setMenuOpen(false)} className="block w-full text-left text-sm text-foreground/70 hover:text-primary transition-colors py-0.5">
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.2em] uppercase text-primary mb-3">
                        <span className="text-sm">🧴</span> Type (유형별)
                      </p>
                      <div className="space-y-1.5">
                        {TYPES.map((t) => (
                          <button key={t} onClick={() => setMenuOpen(false)} className="block w-full text-left text-sm text-foreground/70 hover:text-primary transition-colors py-0.5">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
            whileTap={{ scale: 0.92 }}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </motion.button>

          <Link
            to="/diagnosis"
            className="rounded-full border border-primary px-5 py-2 font-body text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Start Diagnosis
          </Link>

          {/* Auth buttons */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary transition-colors hover:bg-primary/20"
              aria-label="Profile"
            >
              <User className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-flex text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-5 py-2 font-body text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
