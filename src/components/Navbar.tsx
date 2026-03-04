import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

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

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex w-full items-center justify-between px-6 md:px-10 py-4">
        <Logo />

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
