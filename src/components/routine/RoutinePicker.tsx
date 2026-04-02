// src/components/routine/RoutinePicker.tsx
// Bottom sheet: selecting routine tier (Essential / Complete / Pro)
// 2025 UI/UX Redesign — Glassmorphism + Dual Theme + Accessibility

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18nStore } from '@/store/i18nStore';
import { tokens, ctaTokens, ctaGlowToken, bottomSheet } from '@/lib/designTokens';
import { ROUTINE_TIERS } from '@/constants/routineTiers';
import type { RoutineTierId, RoutineTier } from '@/types/routine';
import RoutineStepIcon from './RoutineStepIcon';

// ── i18n ─────────────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'de';

const TX: Record<string, Record<Lang, string>> = {
  title:    { ko: '어떤 루틴이 맞을까요?', en: 'How would you like to care?', de: 'Welche Routine passt zu Ihnen?' },
  subtitle: { ko: 'SPF는 항상 기본으로 포함돼요', en: 'UV protection is always included as your daily shield', de: 'SPF ist immer als täglicher Schutz enthalten' },
  recommended: { ko: '추천', en: 'Recommended', de: 'Empfohlen' },
  helpText: { ko: '잘 모르겠다면? 에센셜부터 시작하세요 — 언제든 업그레이드 가능', en: 'Not sure? Start with Essential — upgrade anytime.', de: 'Unsicher? Starten Sie mit Essential — jederzeit upgraden.' },
  cta:      { ko: '내 루틴 만들기', en: 'Build my routine', de: 'Meine Routine erstellen' },

  // Tier names
  'tier.essential': { ko: '에센셜 루틴', en: 'Essential routine', de: 'Essential-Routine' },
  'tier.complete':  { ko: '풀 케어 루틴', en: 'Complete routine', de: 'Komplett-Routine' },
  'tier.pro':       { ko: '프로 루틴', en: 'Pro routine', de: 'Pro-Routine' },

  // Tier descriptions
  'desc.essential': {
    ko: '바쁜 아침을 위한 핵심 케어. 피부 우선순위에 맞춘 3가지 집중 스텝.',
    en: 'A focused core routine for busy mornings. Three targeted steps for your top skin priorities.',
    de: 'Fokussierte Kernpflege für geschäftige Morgen. Drei gezielte Schritte für Ihre Hautprioritäten.',
  },
  'desc.complete': {
    ko: '레이어드 케어의 풀 프로토콜. 피부의 장기적 건강에 본격 투자.',
    en: 'Full-spectrum layered protocol. A serious investment in your skin\'s long-term health.',
    de: 'Vollständiges Schichtpflege-Protokoll. Eine Investition in die Gesundheit Ihrer Haut.',
  },
  'desc.pro': {
    ko: '에스테틱급 홈케어. 풀 루틴에 LED/갈바닉 디바이스가 더해져요.',
    en: 'Aesthetic-grade home care. Complete routine plus LED or galvanic device care.',
    de: 'Ästhetik-Pflege für Zuhause. Komplette Routine plus LED- oder Galvanik-Pflege.',
  },
  spfNote: {
    ko: '☀️ SPF 자외선 차단 자동 포함',
    en: '☀️ SPF protection auto-included',
    de: '☀️ SPF-Sonnenschutz automatisch enthalten',
  },
  totalProducts: {
    ko: '총 {N}제품',
    en: '{N} products total',
    de: '{N} Produkte gesamt',
  },
  'price.essential': { ko: '~€45', en: '~€45', de: '~€45' },
  'price.complete':  { ko: '~€89', en: '~€89', de: '~€89' },
  'price.pro':       { ko: '~€145', en: '~€145', de: '~€145' },
};

function tx(key: string, lang: Lang): string {
  return TX[key]?.[lang] ?? TX[key]?.en ?? key;
}

// ── Framer Motion variants ───────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const sheetVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const cardContainerVariants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 20 },
  },
};

// ── Tier emoji mapping ───────────────────────────────────────────────────────
const TIER_EMOJI: Record<RoutineTierId, string> = {
  essential: '🌿',
  complete: '✨',
  pro: '💎',
};

// ── TierCard (2025 Glassmorphism Redesign) ───────────────────────────────────

function TierCard({
  tier,
  isSelected,
  onSelect,
  lang,
  isDark,
}: {
  tier: RoutineTier;
  isSelected: boolean;
  onSelect: () => void;
  lang: Lang;
  isDark: boolean;
}) {
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);

  return (
    <motion.button
      variants={cardVariants}
      onClick={onSelect}
      className="w-full text-left relative"
      aria-pressed={isSelected}
      aria-label={tx(`tier.${tier.id}`, lang)}
      style={{
        background: isSelected
          ? `${tok.accent}10`
          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderRadius: 16,
        padding: '1rem 1.25rem',
        border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? tok.accent : tok.border}`,
        transition: 'all 0.2s ease',
        outline: 'none',
        cursor: 'pointer',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Recommended badge */}
      {tier.isDefault && (
        <span
          style={{
            position: 'absolute',
            top: -8,
            right: 16,
            background: ctaTok.background,
            color: '#F5F5F7',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 99,
            fontFamily: "var(--font-sans)",
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
          }}
        >
          {tx('recommended', lang)}
        </span>
      )}

      {/* Header row: Emoji + Name + Price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{TIER_EMOJI[tier.id]}</span>
          <span style={{
            fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
            fontSize: 16,
            fontWeight: 700,
            color: tok.text,
          }}>
            {tx(`tier.${tier.id}`, lang)}
          </span>
        </div>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13, fontWeight: 600,
          color: tok.accent,
        }}>
          {tx(`price.${tier.id}`, lang)}
        </span>
      </div>

      {/* Steps + Time */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 12,
        color: tok.textSecondary,
        marginBottom: 4,
      }}>
        {tier.steps.length + 1 + (tier.includesDevice ? 1 : 0)} {lang === 'ko' ? '단계' : lang === 'de' ? 'Schritte' : 'steps'} · ~{tier.timeMinutes} min
      </p>

      {/* Description */}
      <p style={{
        fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
        fontSize: 12,
        color: tok.textTertiary,
        lineHeight: 1.5,
        marginBottom: 12,
      }}>
        {tx(`desc.${tier.id}`, lang)}
      </p>

      {/* Step icons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {tier.steps.map((step) => (
          <RoutineStepIcon key={step.key} stepKey={step.key} size={36} />
        ))}
        <span style={{ color: tok.textTertiary, fontSize: 14, fontWeight: 500, marginInline: 2 }}>+</span>
        <RoutineStepIcon stepKey="spf" size={36} />
        {tier.includesDevice && (
          <RoutineStepIcon stepKey="device" size={36} />
        )}
      </div>

      {/* SPF notice */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 10, paddingTop: 8,
        borderTop: `1px solid ${tok.border}`,
      }}>
        <span style={{
          fontSize: 11, color: tok.textSecondary,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {tx('spfNote', lang)}
        </span>
      </div>
    </motion.button>
  );
}

// ── Main RoutinePicker ───────────────────────────────────────────────────────

interface RoutinePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tierId: RoutineTierId) => void;
}

export default function RoutinePicker({ isOpen, onClose, onConfirm }: RoutinePickerProps) {
  const { language } = useI18nStore();
  const lang = (['ko', 'de'].includes(language) ? language : 'en') as Lang;
  const [selected, setSelected] = useState<RoutineTierId>('essential');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tok = tokens(isDark);
  const ctaTok = ctaTokens(isDark);
  const sheetTok = isDark ? bottomSheet.dark : bottomSheet.light;

  // Reset to default when reopened
  useEffect(() => {
    if (isOpen) setSelected('essential');
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            key="routine-picker-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998,
            }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="routine-picker-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={tx('title', lang)}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: sheetTok.background,
              borderRadius: sheetTok.borderRadius,
              boxShadow: sheetTok.boxShadow,
              zIndex: 9999,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Handle bar — drag-to-dismiss zone */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 300) {
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 12,
                paddingBottom: 8,
                cursor: 'grab',
                touchAction: 'none',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 99,
                background: sheetTok.handleColor,
              }} />
            </motion.div>

            {/* Scrollable content area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              minHeight: 0,
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', paddingInline: 24, marginBottom: 20, position: 'relative' }}>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 12,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    border: 'none',
                    color: tok.textSecondary,
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <X size={20} />
                </button>
                <h2 style={{
                  fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: tok.text,
                  marginBottom: 4,
                }}>
                  {tx('title', lang)}
                </h2>
                <p style={{
                  fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13,
                  color: tok.textSecondary,
                }}>
                  {tx('subtitle', lang)}
                </p>
              </div>

              {/* Tier cards */}
              <motion.div
                variants={cardContainerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingInline: 20 }}
              >
                {ROUTINE_TIERS.map((tier) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    isSelected={selected === tier.id}
                    onSelect={() => setSelected(tier.id)}
                    lang={lang}
                    isDark={isDark}
                  />
                ))}
              </motion.div>

              {/* Help text */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 16,
                paddingInline: 24,
              }}>
                <HelpCircle size={14} color={tok.textSecondary} />
                <span style={{
                  fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12,
                  color: tok.textSecondary,
                  fontStyle: 'italic',
                }}>
                  {tx('helpText', lang)}
                </span>
              </div>

              {/* CTA button */}
              <div style={{ padding: '20px 20px 20px' }}>
                <motion.button
                  onClick={() => onConfirm(selected)}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: ctaTok.background,
                    color: '#F5F5F7',
                    fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: ctaGlowToken(isDark),
                  }}
                >
                  {tx('cta', lang)} →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
