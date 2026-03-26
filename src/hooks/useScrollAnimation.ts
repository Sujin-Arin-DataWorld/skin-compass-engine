import { useEffect, useRef } from 'react';

/**
 * GPU-performance-safe scroll listener hook.
 *
 * Encapsulates the rAF + useRef pattern proven in BottomNav.tsx:
 * - Debounces via requestAnimationFrame (max 1 call per frame → jank-free on 120Hz)
 * - Stores mutable scroll state in useRef (no re-render storms)
 * - Registers listener with { passive: true }
 * - Handles iOS rubber-band overscroll (clamps negative scrollY to 0)
 * - Cleans up both the event listener and pending rAF on unmount
 *
 * @param callback - Invoked at most once per animation frame with current and previous scrollY.
 *                   Both values are clamped to ≥ 0 (iOS rubber-band safe).
 * @param options  - target: EventTarget to listen on (default: window)
 */
export function useScrollAnimation(
  callback: (scrollY: number, prevScrollY: number) => void,
  options?: { target?: EventTarget },
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    const target = options?.target ?? window;

    const handleScroll = () => {
      // Cancel any pending frame — ensures max 1 invocation per frame
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY); // iOS rubber-band guard
        const prevScrollY = lastScrollYRef.current;
        lastScrollYRef.current = currentScrollY;

        callbackRef.current(currentScrollY, prevScrollY);
      });
    };

    target.addEventListener('scroll', handleScroll as EventListener, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll as EventListener);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [options?.target]);
}
