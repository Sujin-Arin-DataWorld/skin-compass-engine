# Data/AI Engine Reference: Hyper-Personalized Matching

> 수석 데이터/AI 사이언티스트의 상세 스펙

## 1. 추천 아키텍처 개요

"지성이면 A 크림" 같은 단순 IF문은 버린다.
수학적/화학적으로 증명된 초개인화 매칭 엔진을 구축한다.

```
┌─────────────────────────────────────────────────────────┐
│                   추천 파이프라인                         │
│                                                         │
│  유저 10축 스코어  ──→  Gate Filter  ──→  Vector Match  │
│        +                    │                   │       │
│  설문 데이터        ──→  Score 보정    │       │       │
│                             │                   ↓       │
│                             │           코사인 유사도    │
│                             │           Top K 추출       │
│                             │                   │       │
│                             ↓                   ↓       │
│                      Texture Filter  ──→  RAG 처방전    │
│                             │           생성             │
│                             ↓                   │       │
│                      최종 제품 Top 3  ←─────────┘       │
│                      + 처방 근거 텍스트                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Supabase 데이터 모델

### 2.1 핵심 테이블

```sql
-- 제품 테이블 (pgvector 활성화)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 기본 정보
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_de TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'cleanser', 'toner', 'serum', 'cream', 'sunscreen', 'mask'
  routine_slot TEXT NOT NULL, -- 'morning_step1', 'morning_step2', ... 'evening_step4'

  -- 가격
  price_eur NUMERIC(10,2),
  price_krw INTEGER,
  tier TEXT DEFAULT 'standard', -- 'budget', 'standard', 'premium', 'luxury'

  -- 성분 (INCI)
  inci_list TEXT[],           -- 전성분 배열
  key_ingredients JSONB,      -- {"ceramide_np": 2.0, "panthenol": 5.0, ...} (% 농도)

  -- 타겟 프로필
  target_skin_types TEXT[],   -- ['dry', 'combination', 'oily', 'sensitive']
  target_concerns TEXT[],     -- ['dehydration', 'barrier_damage', 'acne', ...]
  target_age_range INT4RANGE, -- [25, 60)

  -- 벡터 (10차원 — 10축 피부 스코어와 매칭용)
  score_vector VECTOR(10),    -- 이 제품이 최적인 피부 프로필 벡터

  -- 메타
  image_url TEXT,
  description_ko TEXT,
  description_en TEXT,
  description_de TEXT,
  market TEXT[] DEFAULT '{KR,DE}', -- 판매 시장
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 벡터 인덱스 (IVFFlat — 1만 개 이하 제품에 적합)
CREATE INDEX idx_products_score_vector
  ON products USING ivfflat (score_vector vector_cosine_ops)
  WITH (lists = 20);

-- 피부 분석 결과 저장
CREATE TABLE user_skin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 분석 결과
  overall_score INTEGER NOT NULL,
  axis_scores JSONB NOT NULL,      -- {"seb": 60, "hyd": 40, ...}
  zone_data JSONB,                 -- 7존 상세 데이터
  score_vector VECTOR(10),         -- axis_scores를 벡터로 변환

  -- 설문 보정 데이터
  survey_data JSONB,               -- 생활 습관 설문 응답

  -- 메타
  analysis_type TEXT DEFAULT 'camera', -- 'camera', 'survey', 'hybrid'
  photo_url TEXT,                   -- 임시 URL (24h 후 파기)
  photo_expires_at TIMESTAMPTZ,    -- 사진 만료 시점
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE user_skin_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see own profiles"
  ON user_skin_profiles FOR ALL
  USING (auth.uid() = user_id);

-- 매칭 결과 캐시
CREATE TABLE product_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES user_skin_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  match_score FLOAT NOT NULL,       -- 코사인 유사도 점수
  match_reason JSONB,               -- 매칭 근거 (축별 기여도)
  prescription_text_ko TEXT,        -- RAG 생성 처방전
  prescription_text_en TEXT,
  prescription_text_de TEXT,
  routine_slot TEXT,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 제품 벡터 생성

제품의 `score_vector`는 "이 제품이 가장 효과적인 피부 프로필"을 나타낸다.

```sql
-- 예: 배리어 리페어 크림의 벡터
-- [seb, hyd, bar, sen, acne, pigment, texture, aging, ox, makeup]
-- 이 크림은 수분 낮고(hyd↓), 장벽 낮은(bar↓) 피부에 최적
INSERT INTO products (name_ko, score_vector, ...)
VALUES (
  '배리어 리페어 크림',
  '[50, 30, 25, 60, 50, 50, 50, 50, 50, 50]'::vector,
  ...
);
```

벡터 값이 낮을수록 = 해당 축 점수가 낮은 유저에게 적합.
유저 벡터와의 코사인 유사도가 높을수록 = 더 잘 맞는 제품.

---

## 3. 벡터 매칭 엔진

### 3.1 PostgreSQL RPC 함수

```sql
-- Supabase Edge Function에서 호출할 RPC
CREATE OR REPLACE FUNCTION match_products(
  query_vector VECTOR(10),
  user_market TEXT DEFAULT 'KR',
  sensitivity_gate BOOLEAN DEFAULT false,
  max_results INTEGER DEFAULT 10,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  name_ko TEXT,
  name_en TEXT,
  name_de TEXT,
  brand TEXT,
  category TEXT,
  routine_slot TEXT,
  price_eur NUMERIC,
  price_krw INTEGER,
  tier TEXT,
  key_ingredients JSONB,
  image_url TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name_ko,
    p.name_en,
    p.name_de,
    p.brand,
    p.category,
    p.routine_slot,
    p.price_eur,
    p.price_krw,
    p.tier,
    p.key_ingredients,
    p.image_url,
    1 - (p.score_vector <=> query_vector) AS similarity
  FROM products p
  WHERE
    p.is_active = true
    AND user_market = ANY(p.market)
    -- Sensitivity Gate: 민감도 높으면 저자극 풀로 제한
    AND (
      NOT sensitivity_gate
      OR 'sensitive' = ANY(p.target_skin_types)
    )
    -- 카테고리 필터 (선택적)
    AND (
      category_filter IS NULL
      OR p.category = category_filter
    )
  ORDER BY p.score_vector <=> query_vector ASC
  LIMIT max_results;
END;
$$;
```

### 3.2 프론트엔드 호출

```typescript
// lib/matching.ts
import { supabase } from './supabase';

interface MatchParams {
  axisScores: SkinScores;
  market: 'KR' | 'DE';
  category?: string;
}

export const fetchMatchedProducts = async ({
  axisScores,
  market,
  category,
}: MatchParams) => {
  // 10축 점수를 벡터로 변환
  const queryVector = [
    axisScores.seb,
    axisScores.hyd,
    axisScores.bar,
    axisScores.sen,
    axisScores.acne,
    axisScores.pigment,
    axisScores.texture,
    axisScores.aging,
    axisScores.ox,
    axisScores.makeup_stability,
  ];

  // Sensitivity Gate 판단
  const sensitivityGate = axisScores.sen >= 80 || axisScores.bar < 30;

  const { data, error } = await supabase.rpc('match_products', {
    query_vector: JSON.stringify(queryVector),
    user_market: market,
    sensitivity_gate: sensitivityGate,
    max_results: 10,
    category_filter: category ?? null,
  });

  if (error) throw new SkinLabAPIError(error.message, 500, 'MATCH_FAILED', true);
  return data;
};
```

---

## 4. 3-Layer Hybrid Matching System

### Layer 1: Global Gate (장벽/민감도 안전 게이트)

```typescript
const applyGlobalGate = (scores: SkinScores): ProductPool => {
  // 장벽 30 미만 OR 민감도 80 이상 → 저자극 풀
  if (scores.bar < 30 || scores.sen >= 80) {
    return 'sensitive_safe';
  }
  // 장벽 30-50 → 마일드 풀
  if (scores.bar < 50) {
    return 'mild';
  }
  // 그 외 → 일반 풀
  return 'general';
};
```

### Layer 2: Per-Zone Scientific Matching

```typescript
// 존별로 가장 점수가 낮은 축을 기반으로 제품 매칭
const matchByZone = (zoneData: ZoneData[], products: Product[]) => {
  return zoneData.map(zone => {
    const worstAxis = getWorstAxis(zone.scores);
    const matched = products.filter(p =>
      p.target_concerns.includes(axisToCondition(worstAxis.key))
    );
    return {
      zone: zone.zone_id,
      axis: worstAxis,
      products: matched.slice(0, 3),
    };
  });
};
```

### Layer 3: Texture Compatibility Engine

```typescript
interface TexturePreference {
  skinType: 'dry' | 'combination' | 'oily';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  preference: 'light' | 'medium' | 'rich';
}

const filterByTexture = (
  products: MatchedProduct[],
  pref: TexturePreference
): MatchedProduct[] => {
  const textureScore = (p: MatchedProduct): number => {
    let score = p.similarity; // 벡터 유사도 기반

    // 계절 보정
    if (pref.season === 'summer' && p.category === 'cream') score -= 0.05;
    if (pref.season === 'winter' && p.tier === 'rich') score += 0.03;

    // 피부 타입 매칭
    if (p.target_skin_types.includes(pref.skinType)) score += 0.1;

    return score;
  };

  return products.sort((a, b) => textureScore(b) - textureScore(a));
};
```

---

## 5. RAG 기반 처방전 생성

### 5.1 처방전 프롬프트 템플릿

```typescript
const buildPrescriptionPrompt = (
  userScores: SkinScores,
  scoreTier: ScoreTier,
  vulnerabilities: VulnerabilityInfo[],
  matchedProduct: MatchedProduct,
  locale: Locale
): string => {
  const lang = locale === 'ko' ? '한국어' : locale === 'de' ? 'Deutsch' : 'English';

  return `
You are a professional dermatological consultant for SkinStrategyLab, a premium skincare platform.

## Patient Profile
- Overall Score: ${userScores.overall}/100 (${scoreTier})
- Top Vulnerabilities:
${vulnerabilities.map(v => `  - ${v.key}: ${v.score}/100 (${v.tier})`).join('\n')}

## Matched Product
- Name: ${matchedProduct.name}
- Key Ingredients: ${JSON.stringify(matchedProduct.key_ingredients)}
- Category: ${matchedProduct.category}

## Instructions
Write a personalized prescription note in ${lang} that:
1. Empathetically addresses the patient's top vulnerability (use their daily experience, not clinical jargon)
2. Explains WHY this specific ingredient combination addresses their issue
3. Connects the product to their skin's needs with scientific backing
4. Maintains a warm, luxurious tone — like a private dermatologist at a premium clinic

Keep it concise: 3-4 sentences maximum.
Do NOT use alarming language. Do NOT mention scores or numbers.
Tone: "Clinical Elegance" — trustworthy yet warm.
`.trim();
};
```

### 5.2 Supabase Edge Function

```typescript
// supabase/functions/generate-prescription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { profileId, productId, locale } = await req.json();

  // 1. 프로필과 제품 데이터 조회
  const { data: profile } = await supabaseAdmin
    .from('user_skin_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  // 2. 처방전 생성 (LLM 호출)
  const prompt = buildPrescriptionPrompt(
    profile.axis_scores,
    getScoreTier(profile.overall_score),
    getVulnerabilities(profile.axis_scores),
    product,
    locale
  );

  const prescription = await callLLM(prompt);

  // 3. 캐시에 저장
  await supabaseAdmin.from('product_matches').upsert({
    profile_id: profileId,
    product_id: productId,
    [`prescription_text_${locale}`]: prescription,
  });

  return new Response(JSON.stringify({ prescription }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## 6. 설문 하이브리드 보정

카메라 분석과 설문 데이터를 결합하여 정확도를 높인다.

### 6.1 보정 로직

```typescript
interface SurveyResponse {
  water_intake: 'low' | 'medium' | 'high';    // 수분 섭취
  sleep_hours: number;                          // 수면 시간
  sun_exposure: 'low' | 'medium' | 'high';     // 자외선 노출
  stress_level: 1 | 2 | 3 | 4 | 5;            // 스트레스
  smoking: boolean;                             // 흡연
  atopy_history: boolean;                       // 아토피 이력
  exercise_frequency: 'none' | 'low' | 'medium' | 'high';
}

const applySurveyCorrection = (
  cameraScores: SkinScores,
  survey: SurveyResponse
): SkinScores => {
  const corrected = { ...cameraScores };

  // 수분 보정: 물 적게 마시면 hyd 신뢰도↑ (카메라 건조 결과 강화)
  if (survey.water_intake === 'low' && cameraScores.hyd < 50) {
    corrected.hyd = Math.max(corrected.hyd - 5, 0);
  }

  // 민감도 보정: 아토피 이력 있으면 상향
  if (survey.atopy_history && cameraScores.sen < 60) {
    corrected.sen = Math.min(corrected.sen + 15, 100);
  }

  // 노화/산화 보정: 자외선 + 흡연 + 수면 부족 → aging, ox 하향
  const lifestyleRisk =
    (survey.sun_exposure === 'high' ? 1 : 0) +
    (survey.smoking ? 1 : 0) +
    (survey.sleep_hours < 6 ? 1 : 0);

  if (lifestyleRisk >= 2) {
    corrected.aging = Math.max(corrected.aging - (lifestyleRisk * 5), 0);
    corrected.ox = Math.max(corrected.ox - (lifestyleRisk * 5), 0);
  }

  // 스트레스 → 트러블 보정
  if (survey.stress_level >= 4) {
    corrected.acne = Math.max(corrected.acne - 8, 0);
  }

  return corrected;
};
```

### 6.2 하이브리드 모드 핵심 문항 (5개)

이탈률을 최소화하기 위해 전체 설문이 아닌 핵심 5문항만 카메라 플로우에 통합:

```typescript
const HYBRID_QUESTIONS = [
  { key: 'water_intake', type: 'select', options: ['low', 'medium', 'high'] },
  { key: 'sleep_hours', type: 'slider', min: 3, max: 10 },
  { key: 'sun_exposure', type: 'select', options: ['low', 'medium', 'high'] },
  { key: 'stress_level', type: 'slider', min: 1, max: 5 },
  { key: 'atopy_history', type: 'boolean' },
];
```

---

## 7. 보안: 군사급 프라이버시

### 7.1 얼굴 사진 자동 파기

```sql
-- Supabase cron job (pg_cron)
-- 매 시간 실행: 24시간 지난 사진 URL을 null로 설정
SELECT cron.schedule(
  'purge-expired-photos',
  '0 * * * *',  -- 매 시간
  $$
  UPDATE user_skin_profiles
  SET
    photo_url = NULL,
    photo_expires_at = NULL
  WHERE
    photo_expires_at IS NOT NULL
    AND photo_expires_at < NOW();
  $$
);

-- Supabase Storage에서도 실제 파일 삭제
-- (Edge Function에서 처리)
```

### 7.2 Storage 파일 삭제 Edge Function

```typescript
// supabase/functions/purge-photos/index.ts
serve(async () => {
  // 만료된 프로필 조회
  const { data: expired } = await supabaseAdmin
    .from('user_skin_profiles')
    .select('id, photo_url')
    .lt('photo_expires_at', new Date().toISOString())
    .not('photo_url', 'is', null);

  for (const profile of expired ?? []) {
    // Storage에서 파일 삭제
    const path = extractStoragePath(profile.photo_url);
    await supabaseAdmin.storage.from('skin-photos').remove([path]);

    // DB에서 URL 제거
    await supabaseAdmin
      .from('user_skin_profiles')
      .update({ photo_url: null, photo_expires_at: null })
      .eq('id', profile.id);
  }

  return new Response(JSON.stringify({
    purged: expired?.length ?? 0,
    timestamp: new Date().toISOString(),
  }));
});
```

### 7.3 데이터 익명화

```sql
-- 익명화 뷰 (분석/통계용)
CREATE VIEW anonymized_skin_data AS
SELECT
  gen_random_uuid() AS anon_id,  -- 실제 user_id 대신 랜덤 UUID
  overall_score,
  axis_scores,
  analysis_type,
  date_trunc('month', created_at) AS analysis_month  -- 날짜를 월 단위로 버림
FROM user_skin_profiles;
```

---

## 8. 유틸리티 함수

```typescript
// lib/scoring.ts

/** 10축 점수에서 상위 N개 취약 축 추출 */
export const getTopVulnerabilities = (
  scores: SkinScores,
  topN: number = 3
): AxisKey[] => {
  return (Object.entries(scores) as [AxisKey, number][])
    .sort(([, a], [, b]) => a - b) // 낮은 점수 우선
    .slice(0, topN)
    .map(([key]) => key);
};

/** 점수 구간 판별 */
export const getScoreTier = (score: number): ScoreTier => {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'attention';
  return 'critical';
};

/** 축 키 → 피부 고민 매핑 */
export const axisToCondition = (key: AxisKey): string => {
  const map: Record<AxisKey, string> = {
    seb: 'excess_oil',
    hyd: 'dehydration',
    bar: 'barrier_damage',
    sen: 'sensitivity',
    acne: 'breakouts',
    pigment: 'hyperpigmentation',
    texture: 'rough_texture',
    aging: 'fine_lines',
    ox: 'oxidative_stress',
    makeup_stability: 'makeup_breakdown',
  };
  return map[key];
};

/** SkinScores → 벡터 배열 변환 (pgvector 호출용) */
export const scoresToVector = (scores: SkinScores): number[] => [
  scores.seb, scores.hyd, scores.bar, scores.sen, scores.acne,
  scores.pigment, scores.texture, scores.aging, scores.ox, scores.makeup_stability,
];
```
