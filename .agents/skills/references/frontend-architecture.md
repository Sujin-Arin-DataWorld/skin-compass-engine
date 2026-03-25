# Frontend Architecture Reference: Zero-Jank Performance

> 수석 프론트엔드 아키텍트의 상세 스펙

## 1. 아키텍처 원칙

웹사이트지만 네이티브 iOS 앱처럼 깃털같이 가벼워야 한다.
0.1초의 버벅임도 허용하지 않는 무결점 퍼포먼스.

**핵심 지표 목표:**
- LCP (Largest Contentful Paint): < 1.5s
- FID (First Input Delay): < 50ms
- CLS (Cumulative Layout Shift): < 0.05
- TTI (Time to Interactive): < 2.5s
- 번들 사이즈 (gzip): < 150KB (초기 로드)

---

## 2. 프로젝트 디렉토리 구조

```
src/
├── app/                    # 라우트 엔트리
│   ├── diagnosis/          # 진단 플로우
│   ├── result/             # 결과 페이지
│   ├── lab/                # 맞춤 루틴 Lab
│   └── profile/            # 사용자 프로필
├── components/
│   ├── ui/                 # 범용 UI (Button, Card, Modal, Skeleton...)
│   ├── diagnosis/          # 진단 전용 컴포넌트
│   ├── result/             # 결과 전용 컴포넌트
│   │   ├── HeroSection.tsx
│   │   ├── VulnerabilityCard.tsx
│   │   ├── CauseAnalysis.tsx
│   │   ├── PrescriptionCard.tsx
│   │   ├── RoutineTimeline.tsx
│   │   └── StickyCTA.tsx
│   └── lab/                # Lab 전용 컴포넌트
├── stores/                 # Zustand 스토어
│   ├── useSkinStore.ts     # 피부 분석 결과 상태
│   ├── useProductStore.ts  # 제품/루틴 상태
│   ├── useAuthStore.ts     # 인증 상태
│   └── useUIStore.ts       # UI 상태 (모달, 토스트 등)
├── hooks/                  # 커스텀 훅
│   ├── useSkinAnalysis.ts
│   ├── useProductMatch.ts
│   └── useImageCompressor.ts
├── lib/                    # 유틸리티
│   ├── supabase.ts         # Supabase 클라이언트
│   ├── i18n.ts             # 다국어 설정
│   ├── scoring.ts          # 점수 계산/분류 유틸
│   └── constants.ts        # 상수
├── types/                  # TypeScript 타입 정의
│   ├── skin.ts
│   ├── product.ts
│   └── supabase.ts
└── i18n/
    ├── ko.json
    ├── en.json
    └── de.json
```

---

## 3. 상태 관리 설계

### 3.1 Zustand 스토어 (글로벌 상태)

```typescript
// stores/useSkinStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface SkinScores {
  seb: number;   // Oiliness
  hyd: number;   // Hydration
  bar: number;   // Barrier
  sen: number;   // Sensitivity
  acne: number;  // Breakouts
  pigment: number;
  texture: number;
  aging: number;
  ox: number;
  makeup_stability: number;
}

interface ZoneData {
  zone_id: string;
  scores: Partial<SkinScores>;
  issues: string[];
}

interface SkinState {
  // 분석 결과
  overallScore: number | null;
  axisScores: SkinScores | null;
  zoneData: ZoneData[];
  scoreTier: ScoreTier | null;
  topVulnerabilities: AxisKey[];  // 점수 낮은 순 Top 3

  // 분석 메타
  analysisId: string | null;
  analyzedAt: string | null;
  photoUrl: string | null;  // 임시 URL (24h 후 파기)

  // 액션
  setAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysis: () => void;
  getVulnerabilities: () => VulnerabilityInfo[];
}

export const useSkinStore = create<SkinState>()(
  devtools(
    persist(
      (set, get) => ({
        overallScore: null,
        axisScores: null,
        zoneData: [],
        scoreTier: null,
        topVulnerabilities: [],
        analysisId: null,
        analyzedAt: null,
        photoUrl: null,

        setAnalysisResult: (result) => {
          const tier = getScoreTier(result.overallScore);
          const vulns = getTopVulnerabilities(result.axisScores, 3);
          set({
            overallScore: result.overallScore,
            axisScores: result.axisScores,
            zoneData: result.zoneData,
            scoreTier: tier,
            topVulnerabilities: vulns,
            analysisId: result.id,
            analyzedAt: new Date().toISOString(),
            photoUrl: result.photoUrl,
          });
        },

        clearAnalysis: () => set({
          overallScore: null,
          axisScores: null,
          zoneData: [],
          scoreTier: null,
          topVulnerabilities: [],
          analysisId: null,
          analyzedAt: null,
          photoUrl: null,
        }),

        getVulnerabilities: () => {
          const { axisScores, topVulnerabilities } = get();
          if (!axisScores) return [];
          return topVulnerabilities.map(key => ({
            key,
            score: axisScores[key],
            tier: getScoreTier(axisScores[key]),
          }));
        },
      }),
      { name: 'ssl-skin-store' }
    ),
    { name: 'SkinStore' }
  )
);
```

### 3.2 React Query (서버 상태)

```typescript
// hooks/useProductMatch.ts
import { useQuery } from '@tanstack/react-query';

export const useProductMatch = (analysisId: string | null) => {
  return useQuery({
    queryKey: ['product-match', analysisId],
    queryFn: () => fetchMatchedProducts(analysisId!),
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000,     // 5분 캐시
    gcTime: 30 * 60 * 1000,       // 30분 가비지 컬렉션
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
};
```

---

## 4. 이미지 처리 최적화

### 4.1 클라이언트 사이드 압축 (Web Worker)

사용자가 15MB 원본 사진을 올려도 UI가 멈추지 않게, Web Worker에서 압축한다.

```typescript
// hooks/useImageCompressor.ts
const TARGET_SIZE = 1024;       // 1024x1024
const TARGET_QUALITY = 0.82;    // WebP 품질
const MAX_FILE_SIZE = 200_000;  // 200KB

export const useImageCompressor = () => {
  const compress = useCallback(async (file: File): Promise<Blob> => {
    // 1. createImageBitmap으로 메인 스레드 블로킹 없이 디코딩
    const bitmap = await createImageBitmap(file);

    // 2. OffscreenCanvas 사용 (Web Worker 호환)
    const canvas = new OffscreenCanvas(TARGET_SIZE, TARGET_SIZE);
    const ctx = canvas.getContext('2d')!;

    // 3. 중앙 크롭 + 리사이즈
    const { sx, sy, sw, sh } = getCenterCrop(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, TARGET_SIZE, TARGET_SIZE);
    bitmap.close();

    // 4. WebP로 인코딩
    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: TARGET_QUALITY,
    });

    // 5. 용량 초과 시 품질 낮춰서 재시도
    if (blob.size > MAX_FILE_SIZE) {
      return canvas.convertToBlob({
        type: 'image/webp',
        quality: 0.65,
      });
    }

    return blob;
  }, []);

  return { compress };
};
```

### 4.2 모바일 카메라 대응 (iOS Safari 이슈)

iPhone 카메라는 4K 해상도로 `canvas.toBlob()`이 silent fail하는 케이스가 있다.

```typescript
// 안전한 캔버스 크기 체크
const MAX_CANVAS_AREA = 16_777_216; // 4096 * 4096 (iOS Safari 한계)

const getSafeCanvasSize = (width: number, height: number) => {
  const area = width * height;
  if (area <= MAX_CANVAS_AREA) return { width, height };

  const ratio = Math.sqrt(MAX_CANVAS_AREA / area);
  return {
    width: Math.floor(width * ratio),
    height: Math.floor(height * ratio),
  };
};
```

---

## 5. 스켈레톤 UI & 낙관적 업데이트

### 5.1 결과 페이지 스켈레톤

분석 결과를 기다리는 동안 이미 화면의 뼈대를 렌더링한다.

```typescript
// components/result/ResultSkeleton.tsx
const ResultSkeleton = () => (
  <div className="animate-pulse space-y-6 p-4">
    {/* 히어로 영역 */}
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-[--bg-elevated]" />
      <div className="space-y-2">
        <div className="w-32 h-8 rounded-lg bg-[--bg-elevated]" />
        <div className="w-48 h-4 rounded bg-[--bg-elevated]" />
      </div>
    </div>

    {/* 취약점 카드 스켈레톤 */}
    {[1, 2].map(i => (
      <div key={i} className="rounded-2xl bg-[--bg-surface] p-5 space-y-3">
        <div className="w-40 h-5 rounded bg-[--bg-elevated]" />
        <div className="w-full h-2 rounded-full bg-[--bg-elevated]" />
        <div className="w-64 h-4 rounded bg-[--bg-elevated]" />
      </div>
    ))}

    {/* 처방전 스켈레톤 */}
    <div className="rounded-2xl bg-[--bg-surface] p-5 space-y-4">
      <div className="w-48 h-5 rounded bg-[--bg-elevated]" />
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-[--bg-elevated]" />
        <div className="space-y-2 flex-1">
          <div className="w-32 h-4 rounded bg-[--bg-elevated]" />
          <div className="w-24 h-4 rounded bg-[--bg-elevated]" />
        </div>
      </div>
    </div>
  </div>
);
```

---

## 6. 에러 핸들링

### 6.1 에러 바운더리

```typescript
// components/ui/ErrorBoundary.tsx
class SkinLabErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-[--bg-surface] flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[--color-attention]" />
          </div>
          <h3 className="text-lg font-semibold text-[--text-primary] mb-2">
            {t('error.analysis_failed_title')}
          </h3>
          <p className="text-sm text-[--text-secondary] mb-6 max-w-sm">
            {t('error.analysis_failed_description')}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            {t('error.retry')}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 6.2 API 에러 패턴

```typescript
// lib/api.ts
class SkinLabAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (error instanceof SkinLabAPIError && !error.retryable) throw error;
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }
  throw new Error('Unreachable');
};
```

---

## 7. 코드 스플리팅 & 레이지 로딩

```typescript
// 결과 페이지 섹션 레이지 로드
const PrescriptionSection = lazy(() =>
  import('./PrescriptionSection').then(m => ({ default: m.PrescriptionSection }))
);

const RoutineTimeline = lazy(() =>
  import('./RoutineTimeline').then(m => ({ default: m.RoutineTimeline }))
);

// Suspense + 스켈레톤 조합
<Suspense fallback={<PrescriptionSkeleton />}>
  <PrescriptionSection analysisId={analysisId} />
</Suspense>
```

---

## 8. i18n 패턴

```typescript
// i18n/ko.json (결과 페이지 키 구조)
{
  "result": {
    "hero": {
      "title": "AI 피부 분석 결과",
      "subtitle": "당신의 피부를 읽었습니다",
      "message": {
        "excellent": "훌륭해요! 현재 루틴이 피부에 딱 맞고 있어요.",
        "good": "전반적으로 좋은 상태예요. 몇 가지 포인트만 더 관리하면 완벽해질 거예요.",
        "attention": "지금이 케어 골든타임이에요. 맞춤 솔루션을 준비했습니다.",
        "critical": "집중 케어가 필요한 시점이에요. 전문 솔루션으로 함께 회복해요."
      }
    },
    "vulnerability": {
      "section_title": "AI가 발견한 것",
      "related_zones": "관련 존",
      "key_ingredients": "핵심 성분"
    },
    "prescription": {
      "section_title": "맞춤 처방전",
      "problem_label": "문제 짚기",
      "ingredient_label": "성분 처방",
      "product_label": "추천 제품",
      "add_to_routine": "루틴에 추가",
      "view_details": "상세보기"
    },
    "routine": {
      "section_title": "맞춤 루틴",
      "morning": "아침 루틴",
      "evening": "저녁 루틴",
      "set_discount": "루틴 세트 {{percent}}% OFF",
      "start_routine": "내 맞춤 루틴 시작하기"
    },
    "feedback": {
      "accuracy_question": "분석 결과가 정확한가요?",
      "accurate": "정확해요",
      "inaccurate": "아니에요"
    }
  }
}
```

---

## 9. Sticky CTA 패턴

```typescript
// components/result/StickyCTA.tsx
const StickyCTA = ({ totalPrice, discountPercent }: Props) => {
  const { ref: triggerRef, inView } = useInView({ threshold: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // Section 4 (처방전) 진입 시 등장
  useEffect(() => {
    if (inView) setIsVisible(true);
  }, [inView]);

  return (
    <>
      {/* 트리거 포인트 (처방전 섹션 상단에 배치) */}
      <div ref={triggerRef} />

      {/* Sticky 바 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              "fixed bottom-0 inset-x-0 z-50",
              "bg-[--bg-deep]/90 backdrop-blur-xl",
              "border-t border-[--glass-border]",
              "p-4 pb-safe" // iOS safe area
            )}
          >
            <button className={cn(
              "w-full py-4 rounded-2xl",
              "bg-gradient-to-r from-[#C9A96E] to-[#E8D5A3]",
              "text-[--bg-deep] font-semibold text-base",
              "gold-glow",
              "active:scale-[0.98] transition-transform"
            )}>
              {t('result.routine.start_routine')}
              {discountPercent > 0 && (
                <span className="ml-2 text-sm opacity-80">
                  ({discountPercent}% OFF)
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

---

## 10. 성능 모니터링

```typescript
// lib/performance.ts
export const reportWebVitals = (metric: Metric) => {
  // Vercel Analytics 또는 자체 수집
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('[Perf] LCP exceeds target:', metric.value);
  }
  if (metric.name === 'CLS' && metric.value > 0.1) {
    console.warn('[Perf] CLS exceeds target:', metric.value);
  }
};
```
