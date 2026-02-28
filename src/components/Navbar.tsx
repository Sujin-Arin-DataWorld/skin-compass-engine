import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
    <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-4">
      <Link to="/" className="font-display text-xl tracking-wide text-foreground glow-cyan">
        Skin Strategy Lab
      </Link>
      <Link
        to="/diagnosis"
        className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground"
      >
        Start Diagnosis
      </Link>
    </div>
  </nav>
);

export default Navbar;
