import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LabCardProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
}

const LabCard = ({ children, className = "", active = true }: LabCardProps) => (
  <motion.div
    className={`rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-lg transition-shadow ${
      active ? "shadow-[0_0_30px_-10px_hsl(var(--accent-cyan)/0.15)]" : ""
    } ${className}`}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    whileHover={{ y: -2, boxShadow: "0 8px 40px -12px hsla(192, 100%, 50%, 0.12)" }}
  >
    {children}
  </motion.div>
);

export default LabCard;
