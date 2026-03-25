---
description: SkinStrategyLab 3인 수석 브리핑 후 프로덕션 코드 작성 응답 프로토콜
---

# SkinStrategyLab 응답 프로토콜

어떤 기능 요청을 받든 아래 순서를 반드시 따른다.

## Step 1: 3인 수석 브리핑 (코드 작성 전 필수)

코드를 작성하기 **전에**, 각 수석의 관점에서 짧고 강렬한 브리핑을 제공한다:

**🎨 수석 디자이너 브리핑:**
- 이 화면/컴포넌트가 유저에게 줘야 할 **감성과 경험**
- 마이크로 인터랙션, 애니메이션, 전환 효과
- 컬러, 타이포그래피, 공감형 카피라이팅 방향
- 참고: `.agents/skills/references/design-system.md`

**⚡ 수석 아키텍트 브리핑:**
- 퍼포먼스 최적화 전략 (렌더링, 번들 사이즈, 이미지 처리)
- 상태 관리 설계 (Zustand 스토어 구조, React Query 캐싱)
- 에러 핸들링, 엣지 케이스, 접근성
- 참고: `.agents/skills/references/frontend-architecture.md`

**🧠 수석 데이터/AI 브리핑:**
- 데이터 흐름 (Supabase 테이블 → 프론트엔드 스토어)
- 추천/매칭 로직 (pgvector, 코사인 유사도, 필터링)
- 보안 (얼굴 데이터 자동 파기, RLS, 익명화)
- 참고: `.agents/skills/references/data-ai-engine.md`

## Step 2: 프로덕션 코드 작성

브리핑 내용을 바탕으로 **완전한 프로덕션 코드**를 작성한다:
- 파일 단위로 전체 코드를 제공 (부분 스니펫 금지)
- TypeScript 타입 정의 포함
- Framer Motion 애니메이션 구체적으로 구현
- i18n (KO/EN/DE) 반영
- 에러 바운더리와 로딩 상태 포함

## Step 3: 통합 가이드

- 파일 경로와 import 구조 명시
- 기존 코드와의 연결점 설명
- Supabase 마이그레이션 SQL이 필요하면 함께 제공

## CRITICAL CONSTRAINTS (절대 위반 금지)

1. **NO SVG face illustration** — AI 분석 비주얼은 `AI_Screen.mp4` 전용
2. **NO 10-axis radar chart** — 바 차트/스코어 카드로 대체
3. **원색 경고색(빨강, 노랑) 금지** — 뮤트 코랄/소프트 로즈 사용
4. **모바일 퍼스트** — 375px에서 먼저 완벽하게 동작
5. **용어: 매칭 점수** (궁합 점수 X) — KO: 매칭 점수, EN: Match Score, DE: Match-Score
