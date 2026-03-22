/**
 * BarrierRecoveryMode.tsx
 *
 * Rendered inside SlideMacroDashboard when BARRIER_EMERGENCY flag is active.
 * Replaces the normal tier selector (3-step / 5-step / 5+Device) with a
 * guided "Empty → Fill → Lock" recovery journey.
 *
 * Image pattern: /productsimage/${product.id}.jpeg
 * onError fallback → shows product.emoji
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@/lib/designTokens';
import { BARRIER_RECOVERY_PHASES } from './BarrierRecoveryProducts';

type LangKey = 'ko' | 'en' | 'de';

const TIMING_LABELS: Record<LangKey, [string, string, string]> = {
  ko: ['지금 단계', '~4일 후',  '~1주 후'],
  en: ['Current',  '~Day 4',   '~Week 1'],
  de: ['Jetzt',    '~Tag 4',   '~Woche 1'],
};

const COPY = {
  banner_title:   { ko: '장벽 응급 상태 감지',                                en: 'Barrier Emergency Detected',                           de: 'Barriere-Notfall erkannt'                       },
  banner_sub:     { ko: '2주 회복 루틴 · 지금 단계에 집중해요',               en: '2-week recovery routine · Focus on the current phase',  de: '2-Wochen-Erholung · Fokus auf die aktuelle Phase' },
  done_badge:     { ko: '완료',          en: 'Done',          de: 'Erledigt'           },
  add_btn:        { ko: '추가',          en: 'Add',           de: 'Hinzufügen'         },
  prev_btn:       { ko: '← 이전',       en: '← Back',        de: '← Zurück'           },
  next_btn:       { ko: '다음 단계 →',  en: 'Next Step →',   de: 'Nächster Schritt →' },
  progress_label: { ko: '{N} / 3 단계 진행 중', en: 'Step {N} of 3', de: 'Schritt {N} / 3'  },
} as const;

function t(key: keyof typeof COPY, lang: LangKey, vars?: Record<string, string | number>): string {
  let s: string = COPY[key][lang] ?? COPY[key].en;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)); });
  return s;
}

interface BarrierRecoveryModeProps {
  lang:         LangKey;
  isDark:       boolean;
  tok:          ReturnType<typeof tokens>;
  onAddToCart?: (productId: string) => void;
}

export default function BarrierRecoveryMode({ lang, isDark, tok, onAddToCart }: BarrierRecoveryModeProps) {
  const [activePhase, setActivePhase] = useState<number>(0);
  const phase = BARRIER_RECOVERY_PHASES[activePhase];

  return (
    <div>

      {/* [A] Red Alert Banner ──────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 12,
        marginBottom: 12,
        background: 'rgba(226,75,74,0.06)',
        border: '1px solid rgba(226,75,74,0.12)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>🛡️</span>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#E24B4A', margin: '0 0 3px' }}>
            {t('banner_title', lang)}
          </p>
          <p style={{ fontSize: '0.8125rem', color: tok.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {t('banner_sub', lang)}
          </p>
        </div>
      </div>

      {/* [B] Progress Stepper ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        {/* Connecting line segments */}
        <div style={{
          position: 'absolute', top: 14, left: '16.5%', right: '16.5%', height: 2,
          display: 'flex',
        }}>
          <div style={{ flex: 1, background: activePhase >= 1 ? '#4A9E68' : tok.border, transition: 'background 0.3s' }} />
          <div style={{ flex: 1, background: activePhase >= 2 ? '#4A9E68' : tok.border, transition: 'background 0.3s' }} />
        </div>

        {BARRIER_RECOVERY_PHASES.map((ph, idx) => {
          const isComplete = idx < activePhase;
          const isActive   = idx === activePhase;
          return (
            <div key={ph.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, position: 'relative' }}>
              <button
                onClick={() => setActivePhase(idx)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem',
                  background: isComplete ? '#4A9E68' : isActive ? ph.color : tok.bgCard,
                  color: (isComplete || isActive) ? '#FFFFFF' : tok.textTertiary,
                  boxShadow: isActive ? `0 0 0 3px ${ph.color}33` : 'none',
                  transition: 'all 0.2s ease',
                  zIndex: 1,
                }}
              >
                {isComplete ? '✓' : idx + 1}
              </button>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isActive ? ph.color : tok.textSecondary, textAlign: 'center' }}>
                {ph.label[lang]}
              </span>
              <span style={{ fontSize: '0.5625rem', color: tok.textTertiary, textAlign: 'center' }}>
                {TIMING_LABELS[lang][idx]}
              </span>
            </div>
          );
        })}
      </div>

      {/* [C] Hero Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {BARRIER_RECOVERY_PHASES.map((ph, idx) => {
          const isActive   = idx === activePhase;
          const isFuture   = idx > activePhase;
          return (
            <button
              key={ph.key}
              onClick={() => setActivePhase(idx)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                cursor: 'pointer', textAlign: 'center' as const,
                border: isActive ? `1.5px solid ${ph.color}` : `1px solid ${tok.border}`,
                background: isActive ? ph.bgColor : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                opacity: isFuture ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>{ph.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? ph.color : tok.textSecondary, marginBottom: 2 }}>
                {ph.label[lang]}
              </div>
              <div style={{ fontSize: '0.6rem', color: tok.textTertiary }}>
                {ph.subtitle[lang]}
              </div>
            </button>
          );
        })}
      </div>

      {/* [D] Phase Detail Panel ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: 8,
            padding: '14px',
            borderRadius: 12,
            background: isDark ? 'rgba(255,255,255,0.03)' : tok.bgCard,
            border: `1px solid ${tok.border}`,
          }}
        >
          {/* Panel header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: tok.text }}>
              {phase.icon} {phase.label[lang]} — {phase.subtitle[lang]}
            </span>
            {activePhase > 0 && (
              <span style={{
                fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: 'rgba(74,158,104,0.1)', color: '#4A9E68',
              }}>
                {t('done_badge', lang)}
              </span>
            )}
          </div>

          {/* Instruction block */}
          <div style={{
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(226,75,74,0.04)', border: '1px solid rgba(226,75,74,0.08)',
            marginBottom: 10,
          }}>
            {phase.instruction[lang].split('\n').map((line, i) => (
              <p key={i} style={{ margin: 0, lineHeight: 1.6, fontSize: '0.8125rem', color: tok.textSecondary }}>
                {line}
              </p>
            ))}
          </div>

          {/* Product cards */}
          {phase.products.map((product) => (
            <div key={product.id} style={{
              padding: '12px',
              borderRadius: 10,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              border: `1px solid ${tok.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
            }}>
              {/* LEFT: 40×40 image with emoji fallback */}
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 20, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.emoji}
                </span>
                <img
                  src={`/productsimage/${product.id}.jpeg`}
                  alt={product.name[lang]}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Second fallback span (shown by onError above) */}
                <span style={{
                  fontSize: 20, position: 'absolute', inset: 0, display: 'none',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {product.emoji}
                </span>
              </div>

              {/* MIDDLE: name + ingredients + badge */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: tok.text }}>
                    {product.name[lang]}
                  </span>
                  {product.badge && (
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 600,
                      padding: '1px 6px', borderRadius: 99,
                      background: 'rgba(55,138,221,0.1)', color: '#378ADD',
                    }}>
                      {product.badge[lang]}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: tok.textSecondary, margin: 0 }}>
                  {product.keyIngredients}
                </p>
              </div>

              {/* RIGHT: price + add button */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: tok.text, marginBottom: 4 }}>
                  €{product.price}
                </div>
                <button
                  onClick={() => onAddToCart?.(product.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF',
                    background: activePhase === 0 ? '#E24B4A' : activePhase === 1 ? '#378ADD' : '#4A9E68',
                  }}
                >
                  {t('add_btn', lang)}
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* [E] Navigation Buttons ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => setActivePhase((p) => Math.max(0, p - 1))}
          disabled={activePhase === 0}
          style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: `1px solid ${tok.border}`,
            background: activePhase === 0
              ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
              : tok.bgCard,
            color: activePhase === 0 ? tok.textTertiary : tok.textSecondary,
            fontSize: '0.875rem', fontWeight: 500,
            cursor: activePhase === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {t('prev_btn', lang)}
        </button>

        <button
          onClick={() => setActivePhase((p) => Math.min(2, p + 1))}
          disabled={activePhase === 2}
          style={{
            flex: 1, padding: '11px', borderRadius: 10, border: 'none',
            background: activePhase === 2
              ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
              : '#4A9E68',
            color: activePhase === 2 ? tok.textTertiary : '#FFFFFF',
            fontSize: '0.875rem', fontWeight: 600,
            cursor: activePhase === 2 ? 'not-allowed' : 'pointer',
          }}
        >
          {t('next_btn', lang)}
        </button>
      </div>

      {/* Progress label */}
      <p style={{
        textAlign: 'center', fontSize: '0.75rem', color: tok.textTertiary,
        marginTop: 8, marginBottom: 0,
      }}>
        {t('progress_label', lang, { N: activePhase + 1 })}
      </p>
    </div>
  );
}
