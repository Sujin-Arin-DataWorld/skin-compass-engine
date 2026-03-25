# Design System Reference: Clinical Elegance

> 수석 UI/UX & 브랜드 경험 디자이너의 상세 스펙

## 1. 브랜드 감성: "Clinical Elegance"

청담 프라이빗 에스테틱에서 VIP 관리를 받는 듯한 감성.
의학적 신뢰감(Clinical)과 럭셔리 뷰티(Elegance)의 교차점.

**레퍼런스 브랜드 무드:**
- Apple Health — 임상적 정확함, 미니멀 데이터 시각화
- Aesop — 타이포그래피 중심의 절제된 럭셔리
- Glossier — 친근하면서도 세련된 톤앤매너
- Dermalogica — 과학 기반 신뢰감

**절대 피해야 할 무드:**
- 싸구려 뷰티 앱 (핑크 + 반짝이)
- IT 개발자 대시보드 (그리드 + 모노스페이스)
- 무서운 병원 앱 (경고색 + 차가운 톤)

---

## 2. 컬러 시스템 상세

### 2.1 베이스 팔레트

```css
:root {
  /* 배경 레이어 */
  --bg-deep:      #141821;   /* 최하층 배경 */
  --bg-base:      #1A1F2E;   /* 주 배경 (딥 네이비) */
  --bg-surface:   #242B3D;   /* 카드/패널 */
  --bg-elevated:  #2D3548;   /* 호버, 모달 */
  --bg-overlay:   rgba(20, 24, 33, 0.85); /* 오버레이 */

  /* 텍스트 */
  --text-primary:   #F0EDE8;   /* 웜 화이트 */
  --text-secondary: #9CA3AF;
  --text-muted:     #6B7280;
  --text-accent:    #C9A96E;   /* 골드 강조 */

  /* 시맨틱 컬러 — 뮤트톤 (원색 금지) */
  --color-excellent:  #4ECDC4; /* 네온 민트 (80+) */
  --color-good:       #7C9CBF; /* 뮤트 블루 (65-79) */
  --color-attention:  #E8A87C; /* 뮤트 코랄 (45-64) */
  --color-critical:   #CF6679; /* 소프트 로즈 (<45) */
  --color-calm:       #6B8F71; /* 딥 세이지 (정보/진정) */

  /* CTA & 프리미엄 */
  --gradient-gold: linear-gradient(135deg, #C9A96E, #E8D5A3);
  --gradient-gold-hover: linear-gradient(135deg, #D4B87A, #F0E0B0);
  --gradient-premium: linear-gradient(135deg, #C9A96E 0%, #E8D5A3 50%, #C9A96E 100%);

  /* 유리 질감 (Glassmorphism) */
  --glass-bg: rgba(36, 43, 61, 0.6);
  --glass-border: rgba(201, 169, 110, 0.15);
  --glass-blur: blur(20px);
}
```

### 2.2 점수 구간별 컬러 매핑

```typescript
const SCORE_COLORS: Record<ScoreTier, string> = {
  excellent: 'var(--color-excellent)',  // #4ECDC4 민트
  good:      'var(--color-good)',       // #7C9CBF 블루
  attention: 'var(--color-attention)',  // #E8A87C 코랄
  critical:  'var(--color-critical)',   // #CF6679 로즈
};

// 프로그레스 바 그라데이션 (점수에 따라 동적)
const getScoreGradient = (score: number): string => {
  if (score >= 80) return 'from-emerald-400/20 to-emerald-400/5';
  if (score >= 65) return 'from-blue-400/20 to-blue-400/5';
  if (score >= 45) return 'from-amber-400/20 to-amber-400/5';
  return 'from-rose-400/20 to-rose-400/5';
};
```

---

## 3. 타이포그래피 상세

### 3.1 폰트 스택

```css
/* EN/DE */
.font-heading-en { font-family: 'Fraunces', Georgia, serif; }
.font-body-en    { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }

/* KO */
.font-heading-ko { font-family: 'Hahmlet', 'Noto Serif KR', serif; }
.font-body-ko    { font-family: 'SUIT', 'Pretendard', -apple-system, sans-serif; }
```

### 3.2 타입 스케일 (모바일 퍼스트)

```
Hero 점수 (58):        text-5xl / font-heading / font-bold    (48px → 60px desktop)
Hero 메시지:           text-lg / font-heading / font-semibold  (18px → 22px)
섹션 타이틀:           text-xl / font-heading / font-semibold  (20px → 24px)
카드 타이틀:           text-base / font-body / font-semibold   (16px → 18px)
본문:                  text-sm / font-body / font-regular      (14px → 16px)
캡션/라벨:             text-xs / font-body / font-medium       (12px → 14px)
점수 숫자 (카드 내):   text-2xl / font-heading / font-bold     (24px → 28px)
```

---

## 4. 컴포넌트 패턴

### 4.1 카드 (Clinical Card)

SkinStrategyLab의 핵심 UI 블록. 모든 정보는 카드 단위로 전달한다.

```tsx
// 기본 카드 컨테이너
<motion.div
  variants={cardVariants}
  className={cn(
    "relative overflow-hidden rounded-2xl",
    "bg-[--bg-surface] border border-[--glass-border]",
    "backdrop-blur-xl",
    "p-5 md:p-6",
    "transition-colors duration-300",
    "hover:bg-[--bg-elevated]"
  )}
>
  {/* 좌측 상단 상태 인디케이터 (뮤트 컬러 도트) */}
  <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[--color-attention]" />

  {/* 콘텐츠 */}
</motion.div>
```

### 4.2 취약점 경고 카드 (Vulnerability Card)

레이더 차트를 대체하는 핵심 컴포넌트. 점수가 낮은 축을 시각적으로 강조한다.

```
┌────────────────────────────────────────────┐
│  ◉ 뮤트 코랄 도트                           │
│                                            │
│  U존 속당김 주의              40/100        │
│  ━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░        │
│                                            │
│  "수분 방어력이 떨어져 장벽이 얇아지고      │
│   있어요. 오후에 화장이 들뜨지 않으셨나요?" │
│                                            │
│  관련 존: U존 (볼, 턱)                     │
│  핵심 성분: 세라마이드 NP, 히알루론산       │
└────────────────────────────────────────────┘
```

점수 50 미만 → 경고 카드 (자동 펼침)
점수 50-64 → 관리 추천 카드 (반투명 배경)
점수 65+ → 양호 카드 (접힌 상태, 탭으로 펼침)

### 4.3 처방전 카드 (Prescription Card)

제품 추천을 "광고"가 아닌 "처방"으로 인식시키는 핵심 UI.

```
┌────────────────────────────────────────────┐
│  💊 처방 #1: 수분 장벽 복구                 │
│                                            │
│  ┌──────────┐                              │
│  │ 문제 짚기│ "무너진 U존 장벽과 속건조를   │
│  └──────────┘  가장 빠르게 해결하려면,"     │
│       ↓                                    │
│  ┌──────────┐                              │
│  │ 성분 처방│ "고농축 세라마이드 NP와       │
│  └──────────┘  저분자 히알루론산 투여가      │
│                시급합니다."                  │
│       ↓                                    │
│  ┌──────────────────────────────────┐      │
│  │  [제품 이미지]                    │      │
│  │  배리어 리페어 크림               │      │
│  │  ★ 4.8 · ₩38,000 / €32.00      │      │
│  │  세라마이드 NP 2% · 판테놀 5%    │      │
│  │                                   │      │
│  │  [루틴에 추가]    [상세보기 →]    │      │
│  └──────────────────────────────────┘      │
└────────────────────────────────────────────┘
```

문제 → 성분 → 제품의 3단 논리 체인을 시각적으로 연결한다.
각 단계 사이에 얇은 연결선 + 화살표로 인과관계를 표현한다.

### 4.4 루틴 타임라인 (Routine Timeline)

```
🌅 아침 루틴
  ①━━━━━②━━━━━③
  클렌저    세럼    선크림

🌙 저녁 루틴
  ①━━━━━②━━━━━③━━━━━④
  클렌저    토너    세럼    크림
```

- 각 스텝 원형 노드를 탭하면 해당 제품 + 처방 근거가 펼쳐진다
- 세트 할인 배지: "루틴 세트 15% OFF"

---

## 5. 애니메이션 상세

### 5.1 분석 대기 연출 (Neuro-Design Loading)

빙글빙글 스피너는 금지. 사용자의 얼굴 사진 위에 프리미엄 스캐닝 효과를 적용한다.

```typescript
// 스캐닝 라인 애니메이션
const ScanLine = () => (
  <motion.div
    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[--color-excellent] to-transparent"
    initial={{ top: '0%' }}
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
  />
);

// 동적 분석 텍스트 (빠르게 교차)
const analysisTexts = [
  t('loading.analyzing_pores'),      // "10만 개의 모공 픽셀 분석 중..."
  t('loading.measuring_hydration'),  // "수분 장벽 심도 측정 중..."
  t('loading.checking_barrier'),     // "피부 장벽 건강도 스캔 중..."
  t('loading.matching_products'),    // "최적 성분 매칭 연산 중..."
];
```

### 5.2 점수 카운트업

```typescript
// 0에서 실제 점수까지 애니메이션
const AnimatedScore = ({ score }: { score: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5초
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return <span>{display}</span>;
};
```

### 5.3 페이지 전환

```typescript
// 결과 페이지 섹션 간 스크롤 트리거 등장
const sectionVariants = {
  hidden:  { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 18 }
  },
};

// 뷰포트 진입 시 트리거 (IntersectionObserver 기반)
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={sectionVariants}
>
```

---

## 6. 공감형 카피라이팅 가이드

### 6.1 점수 구간별 히어로 메시지

```typescript
const heroMessages: Record<ScoreTier, Record<Locale, string>> = {
  excellent: {
    ko: "훌륭해요! 현재 루틴이 피부에 딱 맞고 있어요.",
    en: "Wonderful! Your current routine is working beautifully.",
    de: "Wunderbar! Ihre aktuelle Routine passt perfekt zu Ihrer Haut.",
  },
  good: {
    ko: "전반적으로 좋은 상태예요. 몇 가지 포인트만 더 관리하면 완벽해질 거예요.",
    en: "Your skin is in good shape. A few targeted adjustments will make it perfect.",
    de: "Ihre Haut ist in guter Verfassung. Einige gezielte Anpassungen werden sie perfekt machen.",
  },
  attention: {
    ko: "지금이 케어 골든타임이에요. 맞춤 솔루션을 준비했습니다.",
    en: "Now is the golden time for care. We've prepared a tailored solution for you.",
    de: "Jetzt ist die goldene Zeit für Pflege. Wir haben eine maßgeschneiderte Lösung für Sie.",
  },
  critical: {
    ko: "집중 케어가 필요한 시점이에요. 전문 솔루션으로 함께 회복해요.",
    en: "Your skin needs focused care right now. Let's restore it together with expert solutions.",
    de: "Ihre Haut braucht jetzt intensive Pflege. Lassen Sie uns sie mit Expertenlösungen wiederherstellen.",
  },
};
```

### 6.2 축별 경고 카피

숫자를 유저의 일상 경험으로 번역한다:

```typescript
const axisWarningCopy: Record<AxisKey, Record<Locale, string>> = {
  hyd: {
    ko: "수분 방어력이 떨어져 장벽이 얇아지고 있어요. 오후에 화장이 들뜨거나 당기지 않으셨나요?",
    en: "Your moisture barrier is thinning. Do you notice makeup lifting or tightness in the afternoon?",
    de: "Ihre Feuchtigkeitsbarriere wird dünner. Bemerken Sie nachmittags ein Spannen oder Ablösen des Make-ups?",
  },
  seb: {
    ko: "유분 조절이 과활성 상태예요. T존에 번들거림이 자주 느껴지지 않으셨나요?",
    en: "Oil regulation is overactive. Have you noticed frequent shine in your T-zone?",
    de: "Die Talgproduktion ist überaktiv. Haben Sie häufig Glanz in Ihrer T-Zone bemerkt?",
  },
  // ... 나머지 축도 동일 패턴
};
```

---

## 7. Glassmorphism 적용 가이드

```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

/* 골드 글로우 효과 (CTA 버튼, 프리미엄 요소) */
.gold-glow {
  box-shadow: 0 0 20px rgba(201, 169, 110, 0.15),
              0 0 60px rgba(201, 169, 110, 0.05);
}
```

---

## 8. Responsive Breakpoints

```
모바일:    375px ~ 767px   (기본, 모든 것의 출발점)
태블릿:    768px ~ 1023px  (md:)
데스크톱:  1024px ~         (lg:)

카드 그리드:
  모바일    → 1열
  태블릿    → 2열
  데스크톱  → 2-3열 (max-width: 1200px 컨테이너)
```

---

## 9. 접근성 (a11y)

- 모든 인터랙티브 요소에 `aria-label` 제공
- 점수 컬러에 의존하지 않고 텍스트 라벨로도 상태 전달
- 포커스 링: `focus-visible:ring-2 focus-visible:ring-[--text-accent]`
- 다크 모드 전용이므로 WCAG AA 대비 비율 4.5:1 이상 준수
