/**
 * RoutineBuilder.tsx
 *
 * Layer 3 UI: displays the final AM/PM/mask routine, pH conflict warnings,
 * clinical safety banners, and the Save Routine CTA.
 *
 * Safety rules wired here (via useRoutineBuilder):
 *   RULE 1 — Cumulative Irritation  (warning banner or hard block)
 *   RULE 3 — SPF Mandatory Pairing  (block save if missing)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, CalendarDays, AlertTriangle, ShieldAlert, Check, Save, RefreshCw } from 'lucide-react';

import { useLabSelectionStore } from '../store/useLabSelectionStore';
import { useI18nStore } from '@/store/i18nStore';
import { useRoutineBuilder } from '../hooks/useRoutineBuilder';
import { RoutineStep, PhConflict, TimeOfDay } from '../types';

// ── i18n ──────────────────────────────────────────────────────────────────────

const T = {
  title:             { ko: '나의 루틴', en: 'My Routine', de: 'Meine Routine' },
  am_title:          { ko: '아침 루틴 (AM)', en: 'Morning Routine (AM)', de: 'Morgenroutine (AM)' },
  pm_title:          { ko: '저녁 루틴 (PM)', en: 'Evening Routine (PM)', de: 'Abendroutine (PM)' },
  weekly_title:      { ko: '주간 마스크', en: 'Weekly Masks', de: 'Wöchentliche Masken' },
  conflicts_title:   { ko: 'pH 충돌 경고', en: 'pH Conflict Warnings', de: 'pH-Konflikthinweise' },
  total_cost:        { ko: '총 비용', en: 'Total Cost', de: 'Gesamtkosten' },
  save_btn:          { ko: '루틴 저장', en: 'Save Routine', de: 'Routine speichern' },
  saving:            { ko: '저장 중…', en: 'Saving…', de: 'Speichern…' },
  saved:             { ko: '저장됨 ✓', en: 'Saved ✓', de: 'Gespeichert ✓' },
  blocked_save:      { ko: '안전 문제로 인해 저장이 차단되었습니다', en: 'Save blocked due to safety issues', de: 'Speichern wegen Sicherheitsproblemen blockiert' },
  irritation_warn:   { ko: '⚠ 자극 성분 경고: 동일 루틴에 2가지 전환 성분 포함', en: '⚠ Irritation Warning: 2 turnover actives in the same routine', de: '⚠ Reizwarnung: 2 Turnover-Wirkstoffe in derselben Routine' },
  irritation_block:  { ko: '🚫 자극 차단: 동일 루틴에 3가지 이상 전환 성분 — 제품을 교체하세요', en: '🚫 Irritation Blocked: 3+ turnover actives in one routine — swap a product', de: '🚫 Reizsperre: 3+ Turnover-Wirkstoffe in einer Routine — Produkt tauschen' },
  spf_required:      { ko: '🚫 SPF 필수: PM에 광감작 성분이 있지만 AM에 SPF가 없습니다', en: '🚫 SPF Required: PM has photosensitizing ingredients but AM lacks SPF', de: '🚫 SPF erforderlich: PM enthält photosensibilisierende Stoffe, aber AM fehlt SPF' },
  wait_10min:        { ko: '10분 간격 두기', en: 'Wait 10 min between', de: '10 Min. Pause einhalten' },
  split_am_pm:       { ko: 'AM/PM 분리 사용', en: 'Split AM/PM use', de: 'AM/PM trennen' },
  pm_only:           { ko: 'PM 전용', en: 'PM only', de: 'Nur PM' },
  avoid_combination: { ko: '병용 금지', en: 'Avoid combining', de: 'Kombination vermeiden' },
  zone_apply:        { ko: '적용 부위', en: 'Apply to', de: 'Auftragen auf' },
  no_products:       { ko: '선택된 제품이 없습니다', en: 'No products selected', de: 'Keine Produkte ausgewählt' },
  empty_routine:     { ko: '이 시간대에 해당하는 제품이 없습니다', en: 'No products for this time slot', de: 'Keine Produkte für diesen Zeitraum' },
};

function t(key: keyof typeof T, lang: string): string {
  const entry = T[key];
  return lang === 'ko' ? entry.ko : lang === 'de' ? entry.de : entry.en;
}

// ── Conflict type label ───────────────────────────────────────────────────────

function conflictLabel(type: PhConflict['conflict_type'], lang: string): string {
  switch (type) {
    case 'wait_10min':        return t('wait_10min', lang);
    case 'split_am_pm':       return t('split_am_pm', lang);
    case 'pm_only':           return t('pm_only', lang);
    case 'avoid_combination': return t('avoid_combination', lang);
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RoutineStepRow({
  step,
  isDark,
  language,
}: {
  step: RoutineStep;
  isDark: boolean;
  language: string;
}) {
  const name =
    language === 'ko' ? step.product.name_kr
    : language === 'de' ? step.product.name_de
    : step.product.name_en;

  const brand = step.product.brand;
  const slot = step.product.routine_slot.replace(/_/g, ' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: step.order * 0.04 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Step number */}
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'rgba(201,169,110,0.15)',
          border: '1px solid rgba(201,169,110,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: 'hsl(var(--accent-gold))',
          flexShrink: 0,
          fontFamily: "var(--font-numeric)",
        }}
      >
        {step.order}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isDark ? '#f5f0e8' : '#1a1a2e',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.45)',
            marginTop: 2,
            display: 'flex',
            gap: 6,
          }}
        >
          <span>{brand}</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{slot}</span>
        </div>
      </div>

      {/* Zone tag */}
      {step.zone_instructions.length > 0 && step.zone_instructions[0] !== 'whole_face' && (
        <span
          style={{
            fontSize: 9,
            color: isDark ? 'rgba(245,240,232,0.5)' : 'rgba(26,26,46,0.5)',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            borderRadius: 6,
            padding: '2px 6px',
            flexShrink: 0,
          }}
        >
          {step.zone_instructions[0].replace(/_/g, ' ')}
        </span>
      )}

      {/* Price */}
      <span
        style={{
          fontSize: 11,
          color: 'hsl(var(--accent-gold))',
          fontFamily: "var(--font-numeric)",
          flexShrink: 0,
        }}
      >
        €{step.product.price_eur.toFixed(2)}
      </span>
    </motion.div>
  );
}

function RoutineSection({
  label,
  icon,
  steps,
  isDark,
  language,
}: {
  label: string;
  icon: React.ReactNode;
  steps: RoutineStep[];
  isDark: boolean;
  language: string;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        style={{
          padding: '12px 16px',
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isDark ? '#f5f0e8' : '#1a1a2e',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.4)',
          }}
        >
          {steps.length} {language === 'ko' ? '단계' : language === 'de' ? 'Schritte' : 'steps'}
        </span>
      </div>

      {/* Steps */}
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {steps.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: isDark ? 'rgba(245,240,232,0.35)' : 'rgba(26,26,46,0.35)',
              padding: '8px 2px',
              textAlign: 'center',
            }}
          >
            {t('empty_routine', language)}
          </div>
        ) : (
          steps.map((step) => (
            <RoutineStepRow key={step.product.id} step={step} isDark={isDark} language={language} />
          ))
        )}
      </div>
    </div>
  );
}

function ConflictRow({ conflict, isDark, language }: { conflict: PhConflict; isDark: boolean; language: string }) {
  const typeColor =
    conflict.conflict_type === 'avoid_combination'
      ? '#EF4444'
      : conflict.conflict_type === 'split_am_pm' || conflict.conflict_type === 'pm_only'
      ? '#F59E0B'
      : '#60A5FA';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        background: isDark ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)',
        border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}`,
        fontSize: 11,
        color: isDark ? 'rgba(245,240,232,0.7)' : 'rgba(26,26,46,0.7)',
      }}
    >
      <AlertTriangle size={13} color={typeColor} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        {conflict.product_a_id.slice(0, 8)}… + {conflict.product_b_id.slice(0, 8)}…
      </span>
      <span
        style={{
          fontSize: 10,
          color: typeColor,
          background: `${typeColor}18`,
          border: `1px solid ${typeColor}40`,
          borderRadius: 6,
          padding: '1px 6px',
          flexShrink: 0,
        }}
      >
        {conflictLabel(conflict.conflict_type, language)}
      </span>
    </div>
  );
}

// ── Safety banners ────────────────────────────────────────────────────────────

function SafetyBanner({
  text,
  variant,
  isDark,
}: {
  text: string;
  variant: 'warning' | 'blocked';
  isDark: boolean;
}) {
  const bg = variant === 'blocked'
    ? isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)'
    : isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB';
  const border = variant === 'blocked'
    ? isDark ? 'rgba(239,68,68,0.35)' : '#EF4444'
    : isDark ? 'rgba(245,158,11,0.35)' : '#F59E0B';
  const color = variant === 'blocked'
    ? isDark ? '#FCA5A5' : '#991B1B'
    : isDark ? '#FBBF24' : '#92400E';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        fontSize: 12,
        color,
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{text}</span>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface RoutineBuilderProps {
  onBack?: () => void;
}

export default function RoutineBuilder({ onBack }: RoutineBuilderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();

  const { saveRoutine, error } = useLabSelectionStore();
  const { routine, irritation, spf, isSaveBlocked } = useRoutineBuilder();

  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = async () => {
    if (isSaveBlocked || saveState !== 'idle') return;
    setSaveState('saving');
    await saveRoutine();
    setSaveState('saved');
  };

  if (!routine) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,26,46,0.4)',
          fontSize: 14,
        }}
      >
        {language === 'ko' ? '루틴을 구성 중입니다…' : language === 'de' ? 'Routine wird erstellt…' : 'Building routine…'}
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 16px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 4,
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: isDark ? '#f5f0e8' : '#1a1a2e',
            fontFamily: "var(--font-display)",
            margin: 0,
          }}
        >
          {t('title', language)}
        </h2>

        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 12,
              color: isDark ? 'rgba(245,240,232,0.6)' : 'rgba(26,26,46,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={12} />
            {language === 'ko' ? '다시 선택' : language === 'de' ? 'Neu auswählen' : 'Reselect'}
          </button>
        )}
      </div>

      {/* Safety banners */}
      <AnimatePresence>
        {irritation?.status === 'blocked' && (
          <SafetyBanner key="irr-block" text={t('irritation_block', language)} variant="blocked" isDark={isDark} />
        )}
        {irritation?.status === 'warning' && (
          <SafetyBanner key="irr-warn" text={t('irritation_warn', language)} variant="warning" isDark={isDark} />
        )}
        {spf && !spf.is_valid && (
          <SafetyBanner key="spf" text={t('spf_required', language)} variant="blocked" isDark={isDark} />
        )}
      </AnimatePresence>

      {/* AM Routine */}
      <RoutineSection
        label={t('am_title', language)}
        icon={<Sun size={14} color="#FBBF24" />}
        steps={routine.am_routine}
        isDark={isDark}
        language={language}
      />

      {/* PM Routine */}
      <RoutineSection
        label={t('pm_title', language)}
        icon={<Moon size={14} color="#818CF8" />}
        steps={routine.pm_routine}
        isDark={isDark}
        language={language}
      />

      {/* Weekly Masks */}
      {routine.weekly_masks.length > 0 && (
        <RoutineSection
          label={t('weekly_title', language)}
          icon={<CalendarDays size={14} color="#34D399" />}
          steps={routine.weekly_masks}
          isDark={isDark}
          language={language}
        />
      )}

      {/* pH Conflicts */}
      {routine.ph_conflicts.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)'}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
              borderBottom: `1px solid ${isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={13} color="#EF4444" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isDark ? '#FCA5A5' : '#991B1B',
                letterSpacing: '0.04em',
              }}
            >
              {t('conflicts_title', language)}
            </span>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {routine.ph_conflicts.map((c, i) => (
              <ConflictRow key={i} conflict={c} isDark={isDark} language={language} />
            ))}
          </div>
        </div>
      )}

      {/* Total cost + Save */}
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${isDark ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.3)'}`,
          padding: '16px 20px',
          background: isDark ? 'rgba(201,169,110,0.04)' : 'rgba(201,169,110,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: isDark ? 'rgba(245,240,232,0.45)' : 'rgba(26,26,46,0.45)',
              marginBottom: 3,
              letterSpacing: '0.06em',
            }}
          >
            {t('total_cost', language)}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'hsl(var(--accent-gold))',
              fontFamily: "var(--font-numeric)",
            }}
          >
            €{routine.total_cost_eur.toFixed(2)}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaveBlocked || saveState !== 'idle'}
          style={{
            padding: '12px 22px',
            borderRadius: 12,
            border: isSaveBlocked
              ? `1.5px solid rgba(239,68,68,0.4)`
              : `1.5px solid rgba(201,169,110,0.55)`,
            background: isSaveBlocked
              ? 'rgba(239,68,68,0.08)'
              : saveState === 'saved'
              ? 'rgba(93,202,165,0.14)'
              : 'linear-gradient(135deg, rgba(201,169,110,0.18), rgba(201,169,110,0.08))',
            cursor: isSaveBlocked ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: isSaveBlocked
              ? '#EF4444'
              : saveState === 'saved'
              ? '#5DCAA5'
              : 'hsl(var(--accent-gold))',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saveState === 'saving' ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saveState === 'saved'
            ? <><Check size={14} /> {t('saved', language)}</>
            : saveState === 'saving'
            ? t('saving', language)
            : isSaveBlocked
            ? t('blocked_save', language)
            : <><Save size={14} /> {t('save_btn', language)}</>
          }
        </button>
      </div>

      {/* Supabase error */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: '#EF4444',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
