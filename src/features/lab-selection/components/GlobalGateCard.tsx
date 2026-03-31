import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useLabSelectionStore } from '../store/useLabSelectionStore';
import { useProducts } from '../hooks/useProducts';
import { useI18nStore } from '@/store/i18nStore';
import { CAUTION_CAPS_DISPLAY } from '../utils/cautionCapsDisplay';

// ── i18n helpers ──────────────────────────────────────────────────────────────

type Lang = 'ko' | 'en' | 'de';

const T = {
  recovery_title: {
    ko: '피부 장벽 긴급 복구 모드',
    en: 'Skin barrier emergency recovery',
    de: 'Hautbarriere-Notfallwiederherstellung',
  },
  recovery_message: {
    ko: '현재 피부 장벽이 매우 손상된 상태입니다. 모든 활성 성분(BHA, 비타민C, 레티놀 등)을 일시 정지하고, 2주간 장벽 복구(세라마이드 2:4:2)와 진정(병풀 69%)에만 집중하는 루틴을 제안합니다.',
    en: 'Your skin barrier is severely compromised. All active ingredients (BHA, Vitamin C, Retinol, etc.) are temporarily on hold. We recommend focusing exclusively on barrier repair (Ceramide 2:4:2) and soothing (Centella 69%) for the next 2 weeks.',
    de: 'Ihre Hautbarriere ist stark beschädigt. Alle aktiven Inhaltsstoffe (BHA, Vitamin C, Retinol etc.) werden vorübergehend ausgesetzt. Wir empfehlen, sich 2 Wochen lang ausschließlich auf Barrierereparatur (Ceramid 2:4:2) und Beruhigung (Centella 69%) zu konzentrieren.',
  },
  recovery_cta: {
    ko: '2주 후 재분석하기',
    en: 'Re-diagnose after 2 weeks',
    de: 'Nach 2 Wochen erneut diagnostizieren',
  },
  recovery_why_title: {
    ko: '왜 활성 성분을 중단해야 하나요?',
    en: 'Why pause active ingredients?',
    de: 'Warum aktive Inhaltsstoffe pausieren?',
  },
  recovery_why_body: {
    ko: '손상된 피부 장벽은 평상시에는 안전한 농도의 활성 성분도 과자극으로 받아들입니다. 세라마이드(지질 삼중체), 판테놀, 병풀 성분이 장벽을 먼저 재건한 후 활성 성분을 다시 도입해야 최적의 효과를 기대할 수 있습니다.',
    en: 'A compromised skin barrier perceives even safe concentrations of actives as over-stimulation. Rebuilding the barrier first with ceramides (lipid triad), panthenol, and centella allows actives to be reintroduced for optimal efficacy.',
    de: 'Eine beschädigte Hautbarriere nimmt auch sichere Konzentrationen von Wirkstoffen als Überstimulation wahr. Der Wiederaufbau der Barriere mit Ceramiden (Lipid-Trias), Panthenol und Centella ermöglicht die schrittweise Wiedereinführung von Wirkstoffen.',
  },
  recovery_products_title: {
    ko: '2주 복구 루틴 — 추천 제품',
    en: '2-Week Recovery Routine — Recommended Products',
    de: '2-Wochen-Erholungsroutine — Empfohlene Produkte',
  },
  caution_title: {
    ko: '일부 부위 민감도 주의',
    en: 'Elevated sensitivity detected',
    de: 'Erhöhte Empfindlichkeit erkannt',
  },
  caution_message: {
    ko: '현재 일부 부위의 민감도가 높아, 피부 장벽 보호를 위해 활성 성분 농도를 전문적인 안전 기준치 이하로 자동 조정했습니다.',
    en: 'Some zones show elevated sensitivity. Active ingredient concentrations have been automatically adjusted to professionally safe levels to protect your barrier.',
    de: 'Einige Zonen zeigen erhöhte Empfindlichkeit. Die Konzentrationen aktiver Inhaltsstoffe wurden automatisch auf sichere Werte angepasst.',
  },
  caution_details_toggle: {
    ko: '조정 내역 보기',
    en: 'View adjustments',
    de: 'Anpassungen anzeigen',
  },
  caution_details_collapse: {
    ko: '닫기',
    en: 'Collapse',
    de: 'Schließen',
  },
  clear: {
    ko: '피부 장벽 건강 — 전체 성분 범위 사용 가능',
    en: 'Skin barrier healthy — full ingredient range available',
    de: 'Hautbarriere gesund — vollständige Inhaltsstoffpalette verfügbar',
  },
  entry: { ko: '기본', en: 'Entry', de: 'Basis' },
  full: { ko: '풀', en: 'Full', de: 'Voll' },
  price: { ko: '가격', en: 'Price', de: 'Preis' },
} as const;

function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang];
}

// Static display table for caution caps shown in collapsible section
// (derived from CAUTION_CAPS in routineHelpers — avoids re-importing internals)

// ── Product card for recovery mode ───────────────────────────────────────────

interface RecoveryProductCardProps {
  name: string;
  brand: string;
  priceTier: string;
  priceEur: number;
  isDark: boolean;
  lang: Lang;
}

function RecoveryProductCard({
  name, brand, priceTier, priceEur, isDark, lang,
}: RecoveryProductCardProps) {
  const tierLabel = priceTier === 'entry' ? t('entry', lang) : t('full', lang);
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 10,
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', marginTop: 2 }}>
          {brand}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: 'hsl(var(--accent-gold))', background: 'rgba(200,169,81,0.12)',
          padding: '2px 8px', borderRadius: 20, marginBottom: 4,
        }}>
          {tierLabel}
        </div>
        <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
          €{priceEur.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GlobalGateCard() {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { language } = useI18nStore();
  const lang = (language as Lang) ?? 'en';

  const gateResult = useLabSelectionStore((s) => s.gateResult);
  const [cautionOpen, setCautionOpen] = useState(false);

  // Fetch recovery products only in recovery_only mode
  const { products: recoveryProducts } = useProducts(
    gateResult?.status === 'recovery_only'
      ? { profiles: ['sensitive', 'dry_barrier'], fragranceFree: true }
      : {}
  );

  // ── Case 3: full_routine — show subtle green indicator ─────────────────────
  if (!gateResult || gateResult.status === 'full_routine') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 8, marginBottom: 16,
          background: isDark ? 'rgba(93,202,165,0.08)' : 'rgba(93,202,165,0.12)',
          border: '1px solid rgba(93,202,165,0.25)',
        }}
      >
        <span style={{ fontSize: 14 }}>✓</span>
        <span style={{
          fontSize: 12, fontWeight: 500, letterSpacing: '0.04em',
          color: isDark ? 'rgba(93,202,165,0.9)' : '#085041',
          fontFamily: "var(--font-sans)",
        }}>
          {t('clear', lang)}
        </span>
      </motion.div>
    );
  }

  // ── Case 2: caution — amber banner with collapsible cap details ────────────
  if (gateResult.status === 'caution') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          borderRadius: 12, marginBottom: 24, overflow: 'hidden',
          border: `1px solid ${isDark ? '#F59E0B' : '#D97706'}`,
          boxShadow: isDark ? '0 0 16px rgba(245,158,11,0.2)' : 'none',
          background: isDark ? 'rgba(245,158,11,0.06)' : '#FFFBEB',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '0.03em',
              color: isDark ? '#F59E0B' : '#92400E',
              fontFamily: "var(--font-sans)", marginBottom: 4,
            }}>
              {t('caution_title', lang)}
            </div>
            <div style={{
              fontSize: 12, lineHeight: 1.6,
              color: isDark ? 'rgba(245,158,11,0.8)' : '#78350F',
              fontFamily: "var(--font-sans)",
            }}>
              {t('caution_message', lang)}
            </div>
          </div>
        </div>

        {/* Collapsible detail section */}
        <div style={{
          borderTop: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(217,119,6,0.2)'}`,
          padding: '0 20px',
        }}>
          <button
            onClick={() => setCautionOpen((o) => !o)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: isDark ? '#F59E0B' : '#92400E',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
              fontFamily: "var(--font-sans)",
            }}
          >
            <span>{cautionOpen ? t('caution_details_collapse', lang) : t('caution_details_toggle', lang)}</span>
            <motion.span
              animate={{ rotate: cautionOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-block' }}
            >
              ▾
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {cautionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CAUTION_CAPS_DISPLAY.map((cap) => (
                    <div key={cap.ingredient} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 6,
                      background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.08)',
                      fontSize: 11, fontFamily: "var(--font-sans)",
                    }}>
                      <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#78350F' }}>
                        {cap.ingredient}
                      </span>
                      <span style={{ color: isDark ? '#F59E0B' : '#92400E', fontWeight: 600 }}>
                        {lang === 'ko'
                          ? `최대 ${cap.max}%${cap.note_ko ? ` (${cap.note_ko})` : ''}`
                          : lang === 'de'
                            ? `max. ${cap.max}%${cap.note_de ? ` (${cap.note_de})` : ''}`
                            : `capped at ${cap.max}%${cap.note_en ? ` (${cap.note_en})` : ''}`}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ── Case 1: recovery_only — full warning card ──────────────────────────────
  const entryProducts = recoveryProducts.filter((p) => p.price_tier === 'entry').slice(0, 3);
  const fullProducts = recoveryProducts.filter((p) => p.price_tier === 'full').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        borderRadius: 16, marginBottom: 32, overflow: 'hidden',
        border: '1.5px solid rgba(240,153,123,0.55)',
        boxShadow: isDark
          ? '0 0 20px rgba(240,153,123,0.3)'
          : '0 4px 24px rgba(240,153,123,0.15)',
        background: isDark ? 'hsl(var(--background))' : '#FFF5F2',
      }}
    >
      {/* Warning stripe */}
      <div style={{
        background: isDark
          ? 'linear-gradient(90deg, rgba(240,153,123,0.15) 0%, rgba(183,110,121,0.12) 100%)'
          : 'linear-gradient(90deg, rgba(240,153,123,0.18) 0%, rgba(183,110,121,0.10) 100%)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0, borderRadius: '50%',
          background: isDark ? 'rgba(240,153,123,0.15)' : 'rgba(240,153,123,0.2)',
          border: '1.5px solid rgba(240,153,123,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          🛑
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, letterSpacing: '0.03em',
            color: isDark ? '#F0997B' : '#B55C3A',
            fontFamily: "var(--font-display)", marginBottom: 6,
          }}>
            {t('recovery_title', lang)}
          </div>
          <div style={{
            fontSize: 12, lineHeight: 1.7,
            color: isDark ? 'rgba(240,153,123,0.85)' : '#7C3B20',
            fontFamily: "var(--font-sans)",
          }}>
            {t('recovery_message', lang)}
          </div>
        </div>
      </div>

      {/* Science explanation */}
      <div style={{
        padding: '16px 24px',
        borderTop: `1px solid ${isDark ? 'rgba(240,153,123,0.15)' : 'rgba(240,153,123,0.2)'}`,
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isDark ? 'rgba(240,153,123,0.6)' : '#B55C3A',
          marginBottom: 6, fontFamily: "var(--font-sans)",
        }}>
          {t('recovery_why_title', lang)}
        </div>
        <div style={{
          fontSize: 12, lineHeight: 1.7,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)',
          fontFamily: "var(--font-sans)",
        }}>
          {t('recovery_why_body', lang)}
        </div>
      </div>

      {/* Recovery products */}
      {(entryProducts.length > 0 || fullProducts.length > 0) && (
        <div style={{
          padding: '16px 24px 20px',
          borderTop: `1px solid ${isDark ? 'rgba(240,153,123,0.15)' : 'rgba(240,153,123,0.2)'}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
            marginBottom: 10, fontFamily: "var(--font-sans)",
          }}>
            {t('recovery_products_title', lang)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...entryProducts, ...fullProducts].map((p) => (
              <RecoveryProductCard
                key={p.id}
                name={lang === 'ko' ? p.name_kr : lang === 'de' ? p.name_de : p.name_en}
                brand={p.brand}
                priceTier={p.price_tier}
                priceEur={p.price_eur}
                isDark={isDark}
                lang={lang}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: `1px solid ${isDark ? 'rgba(240,153,123,0.15)' : 'rgba(240,153,123,0.2)'}`,
        display: 'flex', justifyContent: 'center',
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/analysis')}
          style={{
            padding: '12px 32px', borderRadius: 32, cursor: 'pointer',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
            fontFamily: "var(--font-sans)",
            border: '1.5px solid hsl(var(--accent-gold))',
            background: isDark ? 'transparent' : 'rgba(200,169,81,0.08)',
            color: 'hsl(var(--accent-gold))',
            boxShadow: isDark ? '0 0 12px rgba(200,169,81,0.2)' : 'none',
            transition: 'box-shadow 0.2s',
          }}
        >
          {t('recovery_cta', lang)}
        </motion.button>
      </div>
    </motion.div>
  );
}
