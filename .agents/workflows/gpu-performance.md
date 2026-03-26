---
description: GPU-composited rendering & jank-free scroll animation rules for all components
---

# GPU-Composited Performance Standard

All components in this project must follow these rules to avoid thermal throttling and guarantee jank-free UX on 120Hz mobile screens.

---

## 1. Compositor-Only Animated Properties

**Only animate `transform` and `opacity` in scroll-driven or frame-driven contexts.**

Never animate layout-triggering properties (`width`, `height`, `top`, `left`, `margin`, `padding`) or paint-triggering properties (`box-shadow`, `border-radius`, `background-color`) in scroll handlers or per-frame loops.

```css
/* ✅ GOOD — compositor-only */
.fade-in { transition: opacity 0.5s ease, transform 0.5s ease; }

/* ❌ BAD — triggers layout + paint every frame */
.slide-in { transition: left 0.5s ease, box-shadow 0.5s ease; }
```

## 2. GPU Layer Promotion

Add `willChange` to elements that will animate, and **remove it after animation completes** to release GPU memory:

```tsx
// Static declaration for known animations
style={{ willChange: 'transform' }}  // or 'opacity'

// Dynamic: add before animation, remove after
el.style.willChange = 'transform';
el.addEventListener('transitionend', () => { el.style.willChange = 'auto'; });
```

**Reference**: `LiveCamera.tsx` line 404 — `willChange: 'opacity'` on the SVG mask overlay.

## 3. SVG Mask Over CSS Hacks

Use SVG `<mask>` elements for complex cutout/overlay shapes instead of CSS `box-shadow: 9999px` tricks. The old trick causes GPU overdraw → thermal throttling on mid-range Android.

**Reference**: `LiveCamera.tsx` lines 399–436 — SVG mask replaces boxShadow hack.

## 4. Scroll Listener Rules

**All `scroll` event handlers must follow this exact pattern:**

1. Register with `{ passive: true }` — never call `preventDefault()` in scroll handlers
2. Debounce through `requestAnimationFrame` — max 1 handler invocation per frame
3. Store mutable state in `useRef`, **never `useState`** — prevents re-render storms
4. Clean up both the event listener AND pending `cancelAnimationFrame` on unmount

**Use the `useScrollAnimation` hook** (`src/hooks/useScrollAnimation.ts`) instead of hand-rolling this pattern:

```tsx
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

useScrollAnimation((scrollY, prevScrollY) => {
  // runs at most once per frame
  // scrollY & prevScrollY are safe (iOS rubber-band handled)
  const isScrollingDown = scrollY > prevScrollY && scrollY > 50;
  setIsVisible(prev => prev === !isScrollingDown ? prev : !isScrollingDown);
});
```

**Reference**: `BottomNav.tsx` uses this pattern.

## 5. Scroll-Triggered Visibility: CSS Transitions + IntersectionObserver

For "fade-in on scroll into view" patterns, use `IntersectionObserver` + CSS class toggles. Do **not** use JS-driven style mutations in scroll handlers.

```tsx
// ✅ GOOD — IntersectionObserver triggers class toggle
const observer = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) setIsVisible(true);
}, { threshold: 0.25 });
```

```css
/* CSS handles the animation — GPU-composited */
.fade-element {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.fade-element.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Reference**: `AISkinAnalysisHero.tsx` + `AISkinAnalysisHero.module.css`.

## 6. Non-Blocking Blob Creation

Use `fetch(dataURL).then(r => r.blob())` instead of synchronous `atob`/`Uint8Array` loops which block the main thread and freeze animations on mid-range Androids.

```tsx
// ✅ GOOD
const res = await fetch(`data:image/jpeg;base64,${b64}`);
const blob = await res.blob();

// ❌ BAD — blocks main thread
const byteString = atob(b64);
const arr = new Uint8Array(byteString.length);
for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
```

**Reference**: `LiveCamera.tsx` lines 231–234.

## 7. Respect `prefers-reduced-motion`

Disable continuous CSS animations when the user has enabled reduced motion. Use the `usePerformanceMode` hook or a CSS media query:

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element { animation: none !important; transition: none !important; }
}
```

**Reference**: `usePerformanceMode.ts`.

---

## Quick Checklist for Code Review

- [ ] Animations only touch `transform` / `opacity`?
- [ ] `willChange` declared on animated elements?
- [ ] No `addEventListener('scroll', ...)` without `{ passive: true }` + rAF debounce?
- [ ] Scroll state stored in `useRef`, not `useState`?
- [ ] `IntersectionObserver` used for scroll-into-view triggers (not scroll listeners)?
- [ ] `prefers-reduced-motion` respected?
