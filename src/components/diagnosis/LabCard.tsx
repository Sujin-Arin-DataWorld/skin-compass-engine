import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LabCardProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
}

const LabCard = ({ children, className = "", active = true }: LabCardProps) => (
  <motion.div
    className={`rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-shadow ${
      active ? "shadow-[0_0_30px_-10px_hsl(var(--accent-sand)/0.10)]" : ""
    } ${className}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ y: -2, boxShadow: "0 8px 40px -12px hsla(35, 28%, 63%, 0.08)" }}
  >
    {children}
  </motion.div>
);

export default LabCard;
