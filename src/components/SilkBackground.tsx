import { motion } from "framer-motion";

export default function SilkBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Orb 1 — top left, gold */}
      <motion.div
        className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(38 60% 80% / 0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orb 2 — bottom right, warm */}
      <motion.div
        className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(28 50% 75% / 0.14) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      {/* Silk diagonal sweep */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(38 40% 92% / 0.15) 0%, transparent 50%, hsl(20 30% 88% / 0.1) 100%)",
        }}
      />
    </div>
  );
}
