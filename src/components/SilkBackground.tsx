import { motion } from "framer-motion";

export default function SilkBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Orb 1 — top left, sage */}
      <motion.div
        className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(76 26% 80% / 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Orb 2 — bottom right, cool slate */}
      <motion.div
        className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(210 11% 82% / 0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      {/* Silk diagonal sweep — sage/fog */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, hsl(76 20% 90% / 0.1) 0%, transparent 50%, hsl(210 11% 90% / 0.06) 100%)",
        }}
      />

      {/* Dark mode overrides — deeper clinical tones */}
      <style>{`
        .dark .silk-orb-1 {
          background: radial-gradient(circle, hsl(76 20% 20% / 0.18) 0%, transparent 70%) !important;
        }
        .dark .silk-orb-2 {
          background: radial-gradient(circle, hsl(210 14% 14% / 0.15) 0%, transparent 70%) !important;
        }
      `}</style>
    </div>
  );
}
