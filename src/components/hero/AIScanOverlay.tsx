// ═══════════════════════════════════════════════════════════════════════════════
// src/components/hero/AIScanOverlay.tsx
// Metric chips + zone callouts + scan line + corner brackets
// Uses AiScanBadge for premium count-up metric display
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { AiScanBadge } from './AiScanBadge';

export default function AIScanOverlay() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">

      {/* ── Golden Scan Line ── */}
      <motion.div
        initial={{ top: '3%' }}
        animate={{ top: '75%' }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        className="absolute left-[18%] right-[18%] md:left-[21%] md:right-[19%] h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.5) 20%, rgba(201,169,110,0.85) 50%, rgba(201,169,110,0.5) 80%, transparent 100%)',
          boxShadow: '0 0 12px 2px rgba(201,169,110,0.15)',
        }}
      />

      {/* ── Metric Badges (AiScanBadge) ── */}
      {/* LEFT BADGES (HYD, BAR, PIG) */}
      <div className="absolute top-[12%] md:top-[15%] left-[4%] md:left-[12%] flex flex-col gap-2 md:gap-2.5">
        <AiScanBadge axis="HYD" score={72} position="left" delay={0.8} />
        <AiScanBadge axis="BAR" score={85} position="left" delay={0.95} />
        <AiScanBadge axis="PIG" score={51} position="left" delay={1.1} />
      </div>

      {/* RIGHT BADGES (SEB, AGE, TEX) */}
      <div className="absolute top-[12%] md:top-[15%] right-[2%] md:right-[12%] flex flex-col gap-2 md:gap-2.5 items-end">
        <AiScanBadge axis="SEB" score={38} position="right" delay={0.9} />
        <AiScanBadge axis="AGE" score={24} position="right" delay={1.05} />
        <AiScanBadge axis="TEX" score={42} position="right" delay={1.2} />
      </div>

      {/* ── Zone Callouts (desktop only) ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="hidden md:flex absolute top-[50%] left-[10%] flex-col gap-0.5 px-3 py-2 rounded-lg bg-black/55 backdrop-blur-sm border border-[#c9a96e]/20"
      >
        <span className="text-[9px] uppercase tracking-widest text-[#c9a96e] flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" /> T-ZONE
        </span>
        <span className="text-[10px] text-white/60">Oiliness detected</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.5 }}
        className="hidden md:flex absolute top-[50%] right-[8%] flex-col gap-0.5 px-3 py-2 rounded-lg bg-black/55 backdrop-blur-sm border border-[#c9a96e]/20 items-end text-right"
      >
        <span className="text-[9px] uppercase tracking-widest text-[#c9a96e] flex items-center gap-1 font-semibold flex-row-reverse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#facc15] animate-pulse" /> CHEEKS
        </span>
        <span className="text-[10px] text-white/60">Barrier stress</span>
      </motion.div>

      {/* ── Corner Brackets (camera viewfinder effect) ── */}
      <div className="absolute top-[3%] left-[17%] w-5 h-5 border-t border-l border-[#c9a96e]/25 rounded-tl-sm" />
      <div className="absolute top-[3%] right-[15%] w-5 h-5 border-t border-r border-[#c9a96e]/25 rounded-tr-sm" />
      <div className="absolute bottom-[28%] md:bottom-[10%] left-[17%] w-5 h-5 border-b border-l border-[#c9a96e]/25 rounded-bl-sm" />
      <div className="absolute bottom-[28%] md:bottom-[10%] right-[15%] w-5 h-5 border-b border-r border-[#c9a96e]/25 rounded-br-sm" />
    </div>
  );
}
