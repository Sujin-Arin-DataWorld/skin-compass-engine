// ═══════════════════════════════════════════════════════════════════════════════
// src/components/hero/AiScanBadge.tsx
// Metric badge with count-up animation & clinical elegance palette
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AiScanBadgeProps {
  axis: string;   // 'HYD' | 'SEB' | 'BAR' | 'AGE' | 'PIG' | 'TEX'
  score: number;
  position: 'left' | 'right';
  delay: number;
}

// 축별 컬러 매핑 (Clinical Elegance 팔레트)
const AXIS_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  HYD: { border: '#7C9CBF', text: '#7C9CBF', bg: 'rgba(124,156,191,0.12)' },  // 뮤트 블루
  BAR: { border: '#4ECDC4', text: '#4ECDC4', bg: 'rgba(78,205,196,0.12)' },   // 네온 민트
  PIG: { border: '#C9A96E', text: '#C9A96E', bg: 'rgba(201,169,110,0.12)' },  // 골드
  SEB: { border: '#E8A87C', text: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },  // 뮤트 코랄
  AGE: { border: '#9CA3AF', text: '#9CA3AF', bg: 'rgba(156,163,175,0.10)' },  // 그레이
  TEX: { border: '#6B8F71', text: '#6B8F71', bg: 'rgba(107,143,113,0.12)' },  // 딥 세이지
};

export const AiScanBadge = ({ axis, score, position, delay }: AiScanBadgeProps) => {
  const colors = AXIS_COLORS[axis] ?? AXIS_COLORS.AGE;

  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}40`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Pulse dot — "라이브 스캔 중" 느낌 */}
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: colors.text }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: delay * 0.5 }}
      />
      <span style={{ color: colors.text }}>{axis}</span>
      {/* 숫자 카운트업 애니메이션 */}
      <CountUpScore target={score} color={colors.text} delay={delay} />
    </motion.div>
  );
};

// 숫자가 0에서 target까지 올라오는 카운트업 서브컴포넌트
const CountUpScore = ({ target, color, delay }: { target: number; color: string; delay: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = Math.ceil(target / 20);
      const interval = setInterval(() => {
        start = Math.min(start + step, target);
        setDisplay(start);
        if (start >= target) clearInterval(interval);
      }, 40);
    }, delay * 1000 + 300);

    return () => clearTimeout(timeout);
  }, [target, delay]);

  return (
    <span style={{ color }} className="tabular-nums">
      {display}
    </span>
  );
};
