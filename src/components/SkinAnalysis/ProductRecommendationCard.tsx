// Prompt 4 UPDATE — Product recommendation card
// Shows products matching trigger_conditions from AI scores

import { useNavigate } from 'react-router-dom';
import { useI18nStore } from '@/store/i18nStore';
import type { ProductRule, SkinAxisScores } from '@/types/skinAnalysis';
import { AXIS_KO_SHORT } from '@/data/productRules';
import CompatibilityBadge from '@/components/product/CompatibilityBadge';
import type { Product } from '@/engine/types';

interface ProductRecommendationCardProps {
  rule: ProductRule;
  scores: SkinAxisScores;
}

export default function ProductRecommendationCard({
  rule,
  scores,
}: ProductRecommendationCardProps) {
  const { language } = useI18nStore();
  const navigate = useNavigate();

  const name =
    language === 'ko'
      ? rule.name.ko
      : language === 'de'
        ? rule.name.de
        : rule.name.en;
  const copy =
    language === 'ko'
      ? rule.marketingCopy.ko
      : language === 'de'
        ? rule.marketingCopy.de
        : rule.marketingCopy.en;

  return (
    <div
      className="flex gap-3 rounded-2xl p-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      {/* Match score badge — top right */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <CompatibilityBadge
          product={{
            id: rule.productId,
            name: rule.name,
            brand: '',
            phase: '',
            type: '',
            price_eur: 0,
            tier: [],
            shopify_handle: '',
            key_ingredients: rule.targetAxes.map(a => a),
            target_axes: rule.targetAxes as Product['target_axes'],
            for_skin: [],
          } as Product}
          variant="compact"
        />
      </div>
      {/* Product image */}
      <div
        className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(201,169,110,0.1)' }}
      >
        <img
          src={rule.image}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder letter
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            color: '#c9a96e',
            opacity: 0.6,
          }}
        >
          {name[0]}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium leading-snug mb-1"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {name}
        </p>
        <p
          className="mb-2 leading-snug"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {copy}
        </p>

        {/* Target axis badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rule.targetAxes.map((axis) => {
            const score = scores[axis as keyof SkinAxisScores];
            const isHighSeverity =
              ['hyd', 'bar', 'makeup_stability'].includes(axis)
                ? score < 40
                : score > 60;
            return (
              <span
                key={axis}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  background: isHighSeverity
                    ? 'rgba(248,113,113,0.15)'
                    : 'rgba(201,169,110,0.15)',
                  border: `1px solid ${isHighSeverity ? 'rgba(248,113,113,0.35)' : 'rgba(201,169,110,0.35)'}`,
                  color: isHighSeverity ? '#f87171' : '#c9a96e',
                  fontFamily: 'var(--font-sans)',
                  animation: isHighSeverity
                    ? 'pulse-glow 2s ease-in-out infinite'
                    : undefined,
                }}
              >
                {AXIS_KO_SHORT[axis] ?? axis} {score}{language === 'ko' ? '점' : language === 'de' ? 'P.' : 'pt'}
                {isHighSeverity ? (language === 'ko' ? ' → 개선 필요' : language === 'de' ? ' → Pflege nötig' : ' → Needs care') : ''}
              </span>
            );
          })}
        </div>

        <button
          onClick={() => navigate(`/formula/${rule.productId}`)}
          className="rounded-full px-3 py-1 text-xs"
          style={{
            background: 'rgba(201,169,110,0.15)',
            border: '1px solid rgba(201,169,110,0.3)',
            color: '#c9a96e',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {language === 'ko' ? '자세히 보기 →' : language === 'de' ? 'Details →' : 'View details →'}
        </button>
      </div>
    </div>
  );
}
