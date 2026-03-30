// src/components/routine/RoutinePicker.tsx
// Bottom sheet component for selecting routine tier (Essential / Complete / Pro)

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useI18nStore } from '@/store/i18nStore';
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
    en: 'Aesthetic-grade home care. Complete routine plus LED or galvanic device treatment.',
    de: 'Ästhetik-Pflege für Zuhause. Komplette Routine plus LED- oder Galvanik-Behandlung.',
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

// ── TierCard ─────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isSelected,
  onSelect,
  lang,
}: {
  tier: RoutineTier;
  isSelected: boolean;
  onSelect: () => void;
  lang: Lang;
}) {
  return (
    <motion.button
      variants={cardVariants}
      onClick={onSelect}
      className="w-full text-left relative"
      style={{
        background: '#242B3D',
        borderRadius: 14,
        padding: 16,
        border: isSelected ? '1.5px solid #C9A96E' : '1.5px solid transparent',
        transition: 'border-color 0.2s ease',
        outline: 'none',
        cursor: 'pointer',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Recommended badge — Essential only */}
      {tier.isDefault && (
        <span
          style={{
            position: 'absolute',
            top: -8,
            right: 16,
            background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
            color: '#1A1F2E',
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 10,
            fontFamily: "var(--font-sans)",
            letterSpacing: '0.03em',
          }}
        >
          {tx('recommended', lang)}
        </span>
      )}

      {/* Header row: Tier name + Time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{
          fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
          fontSize: 16,
          fontWeight: 600,
          color: '#F0EDE8',
        }}>
          {tx(`tier.${tier.id}`, lang)}
        </span>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12,
          color: '#9CA3AF',
        }}>
          ~{tier.timeMinutes} min
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
        fontSize: 13,
        color: '#9CA3AF',
        lineHeight: 1.5,
        marginBottom: 14,
      }}>
        {tx(`desc.${tier.id}`, lang)}
      </p>

      {/* Step icons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {tier.steps.map((step) => (
          <RoutineStepIcon key={step.key} stepKey={step.key} size={36} />
        ))}

        {/* Plus separator */}
        <span style={{ color: '#6B7280', fontSize: 14, fontWeight: 500, marginInline: 2 }}>+</span>

        {/* SPF Shield (always) */}
        <RoutineStepIcon stepKey="spf" size={36} />

        {/* Device (Pro only) */}
        {tier.includesDevice && (
          <>
            <RoutineStepIcon stepKey="device" size={36} />
          </>
        )}
      </div>

      {/* SPF notice + total products */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 10, paddingTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontSize: 11, color: '#7C9CBF',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {tx('spfNote', lang)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: '#9CA3AF',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {tx('totalProducts', lang).replace('{N}', String(tier.steps.length + 1 + (tier.includesDevice ? 1 : 0)))}
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
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              background: '#1A1F2E',
              borderRadius: '20px 20px 0 0',
              zIndex: 9999,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <div style={{
                width: 40,
                height: 4,
                borderRadius: 99,
                background: '#333A4D',
              }} />
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', paddingInline: 24, marginBottom: 20 }}>
              <h2 style={{
                fontFamily: lang === 'ko' ? "'Hahmlet', serif" : "'Fraunces', serif",
                fontSize: 18,
                fontWeight: 500,
                color: '#F0EDE8',
                marginBottom: 6,
              }}>
                {tx('title', lang)}
              </h2>
              <p style={{
                fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: 13,
                color: '#9CA3AF',
              }}>
                {tx('subtitle', lang)}
              </p>
            </div>

            {/* Tier cards */}
            <motion.div
              variants={cardContainerVariants}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingInline: 20 }}
            >
              {ROUTINE_TIERS.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isSelected={selected === tier.id}
                  onSelect={() => setSelected(tier.id)}
                  lang={lang}
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
              <HelpCircle size={14} color="#7C9CBF" />
              <span style={{
                fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                color: '#7C9CBF',
                fontStyle: 'italic',
              }}>
                {tx('helpText', lang)}
              </span>
            </div>

            {/* CTA button */}
            <div style={{ padding: '16px 20px 20px' }}>
              <motion.button
                onClick={() => onConfirm(selected)}
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '14px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #C9A96E, #E8D5A3)',
                  color: '#1A1F2E',
                  fontFamily: lang === 'ko' ? "'SUIT', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                {tx('cta', lang)}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
