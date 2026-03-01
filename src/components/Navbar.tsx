import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center">
          <img
            src={logoLight}
            alt="Skin Strategy Lab"
            className="h-10 w-auto dark:hidden"
            loading="eager"
          />
          <img
            src={logoDark}
            alt="Skin Strategy Lab"
            className="h-10 w-auto hidden dark:block"
            loading="eager"
          />
        </Link>

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
