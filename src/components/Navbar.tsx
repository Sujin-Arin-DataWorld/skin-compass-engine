import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import logoImg from "@/assets/logo.png";

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logoImg}
            alt="Skin Strategy Lab"
            className="h-9 w-9 rounded-sm object-cover object-bottom dark:object-bottom"
          />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">
              Skin Strategy
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-primary">
              Lab
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <motion.button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-primary/40"
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
            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
          >
            Start Diagnosis
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
