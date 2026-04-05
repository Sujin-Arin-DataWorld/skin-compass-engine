// generateShareCard.ts
// Canvas 2D — no new packages needed.
// Produces a 1080×1920 JPEG suitable for Instagram Stories.
// Fonts: Fraunces (display), Plus Jakarta Sans (body) — loaded via CSS @font-face,
//        available in canvas because the browser shares the same font engine.

import { tierGradients } from '@/lib/designTokens';
import type { ScoreTier } from '@/lib/designTokens';

export interface ShareCardAxis {
  key: string;
  healthScore: number;
}

export interface GenerateShareCardOptions {
  overallScore: number;
  tier: ScoreTier;
  top3: ShareCardAxis[];
  lang: 'ko' | 'en' | 'de';
}

// ── Axis label map (compact labels for the card) ──────────────────────────────
const AXIS_LABEL: Record<string, Record<string, string>> = {
  hyd:              { ko: '수분',       en: 'Hydration',   de: 'Feuchtigkeit' },
  seb:              { ko: '피지',       en: 'Sebum',       de: 'Talg'         },
  sen:              { ko: '민감성',     en: 'Sensitivity', de: 'Sensitivität' },
  acne:             { ko: '트러블',     en: 'Acne',        de: 'Akne'         },
  pigment:          { ko: '색소',       en: 'Pigment',     de: 'Pigment'      },
  texture:          { ko: '결',         en: 'Texture',     de: 'Textur'       },
  aging:            { ko: '안티에이징', en: 'Aging',       de: 'Alterung'     },
  ox:               { ko: '산화',       en: 'Oxidation',   de: 'Oxidation'    },
  bar:              { ko: '장벽',       en: 'Barrier',     de: 'Barriere'     },
  makeup_stability: { ko: '메이크업',   en: 'Makeup Stay', de: 'Makeup-Halt'  },
};

const TIER_LABEL: Record<ScoreTier, Record<string, string>> = {
  excellent: { ko: '우수',   en: 'Excellent',   de: 'Ausgezeichnet' },
  good:      { ko: '양호',   en: 'Good',        de: 'Gut'           },
  attention: { ko: '보통',   en: 'Fair',        de: 'Mäßig'         },
  critical:  { ko: '주의',   en: 'Needs Care',  de: 'Pflegebedarf'  },
};

const SECTION_LABEL: Record<string, Record<string, string>> = {
  overall: { ko: '종합 피부 점수', en: 'OVERALL SKIN SCORE', de: 'GESAMT-HAUTPUNKTZAHL' },
  focus:   { ko: '관리 포인트',   en: 'KEY FOCUS AREAS',    de: 'PFLEGEBEDARF'          },
};

// ── Helper: rounded rect path (safe for all browsers) ───────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const clampedR = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + clampedR, y);
  ctx.lineTo(x + w - clampedR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
  ctx.lineTo(x + w, y + h - clampedR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
  ctx.lineTo(x + clampedR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
  ctx.lineTo(x, y + clampedR);
  ctx.quadraticCurveTo(x, y, x + clampedR, y);
  ctx.closePath();
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function generateShareCard({
  overallScore,
  tier,
  top3,
  lang,
}: GenerateShareCardOptions): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Wait for document fonts to be ready so custom fonts render in canvas
  await document.fonts.ready;

  // ── Background gradient ────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.7, H);
  bgGrad.addColorStop(0,   '#0d0d12');
  bgGrad.addColorStop(0.5, '#10141a');
  bgGrad.addColorStop(1,   '#080b0e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grain (tiny semi-transparent dots)
  ctx.fillStyle = 'rgba(255,255,255,0.016)';
  for (let i = 0; i < 5000; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // ── Brand header ───────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = '400 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(201,169,110,0.45)';
  ctx.textAlign = 'center';
  ctx.fillText('SKIN STRATEGY LAB', W / 2, 106);
  ctx.restore();

  // Divider under brand
  ctx.save();
  ctx.strokeStyle = 'rgba(201,169,110,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.38, 130);
  ctx.lineTo(W * 0.62, 130);
  ctx.stroke();
  ctx.restore();

  // ── Score ring ────────────────────────────────────────────────────────────
  const { gradient: tierGrad, color: tierColor } = tierGradients[tier];
  const ringCX = W / 2;
  const ringCY = H * 0.37;
  const ringR = 210;
  const ringStroke = 20;

  // Track ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = ringStroke;
  ctx.stroke();
  ctx.restore();

  // Colored progress arc
  const arcStart = -Math.PI / 2;
  const arcEnd = arcStart + (overallScore / 100) * Math.PI * 2;
  const arcGrad = ctx.createLinearGradient(
    ringCX - ringR, ringCY - ringR,
    ringCX + ringR, ringCY + ringR,
  );
  arcGrad.addColorStop(0, tierGrad[0]);
  arcGrad.addColorStop(1, tierGrad[1]);

  ctx.save();
  ctx.beginPath();
  ctx.arc(ringCX, ringCY, ringR, arcStart, arcEnd);
  ctx.strokeStyle = arcGrad;
  ctx.lineWidth = ringStroke;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Soft glow around the arc end
  ctx.save();
  ctx.shadowColor = tierColor;
  ctx.shadowBlur = 48;
  ctx.beginPath();
  ctx.arc(ringCX, ringCY, ringR, arcEnd - 0.05, arcEnd);
  ctx.strokeStyle = tierColor;
  ctx.lineWidth = ringStroke + 2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Score number inside ring
  ctx.save();
  ctx.font = `700 172px "Fraunces", serif`;
  ctx.fillStyle = '#F5F5F7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${overallScore}`, ringCX, ringCY - 18);
  ctx.restore();

  // Tier label inside ring
  ctx.save();
  ctx.font = `500 38px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = tierColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TIER_LABEL[tier][lang], ringCX, ringCY + 104);
  ctx.restore();

  // "Overall Skin Score" label below ring
  ctx.save();
  const overallLbl = (SECTION_LABEL.overall[lang] ?? 'OVERALL SKIN SCORE').toUpperCase();
  ctx.font = `400 26px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.textAlign = 'center';
  ctx.fillText(overallLbl, W / 2, ringCY + ringR + 72);
  ctx.restore();

  // ── Top 3 axes ────────────────────────────────────────────────────────────
  const barSectionTop = H * 0.64;
  const BAR_W = W * 0.72;
  const BAR_X = (W - BAR_W) / 2;
  const BAR_H = 10;
  const ROW_H = 108;

  // Section label
  ctx.save();
  const focusLbl = (SECTION_LABEL.focus[lang] ?? 'KEY FOCUS AREAS').toUpperCase();
  ctx.font = `400 24px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.textAlign = 'center';
  ctx.fillText(focusLbl, W / 2, barSectionTop - 36);
  ctx.restore();

  top3.forEach((axis, i) => {
    const y = barSectionTop + i * ROW_H;
    const label = AXIS_LABEL[axis.key]?.[lang] ?? axis.key;
    const score = axis.healthScore;
    const axTier: ScoreTier =
      score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 45 ? 'attention' : 'critical';
    const axColor = tierGradients[axTier].color;
    const axGrad = tierGradients[axTier].gradient;

    // Label
    ctx.save();
    ctx.font = `500 32px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.textAlign = 'left';
    ctx.fillText(label, BAR_X, y);
    ctx.restore();

    // Score value
    ctx.save();
    ctx.font = `600 32px "Fraunces", serif`;
    ctx.fillStyle = axColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, BAR_X + BAR_W, y);
    ctx.restore();

    // Track
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, BAR_X, y + 16, BAR_W, BAR_H, BAR_H / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.restore();

    // Fill
    const fillW = Math.max((score / 100) * BAR_W, BAR_H);
    const fillGrad = ctx.createLinearGradient(BAR_X, 0, BAR_X + fillW, 0);
    fillGrad.addColorStop(0, axGrad[0]);
    fillGrad.addColorStop(1, axGrad[1]);
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, BAR_X, y + 16, fillW, BAR_H, BAR_H / 2);
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.restore();
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = H - 200;

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.15, footerY);
  ctx.lineTo(W * 0.85, footerY);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `400 30px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(201,169,110,0.55)';
  ctx.textAlign = 'center';
  ctx.fillText('skinstrategylab.de', W / 2, footerY + 64);
  ctx.restore();

  ctx.save();
  ctx.font = `400 26px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.textAlign = 'center';
  ctx.fillText('#SkinStrategyLab', W / 2, footerY + 112);
  ctx.restore();

  // ── Return as JPEG Blob ────────────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/jpeg',
      0.92,
    );
  });
}
