import { useState, useEffect } from "react";

/**
 * Detects low-end devices by measuring FPS over a short window.
 * Returns `true` if the device is low-performance (avg FPS < 30).
 */
export function usePerformanceMode(): { reducedMotion: boolean } {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion first
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
      return;
    }

    // FPS sampling: measure over 500ms
    let frameCount = 0;
    const startTime = performance.now();
    let rafId: number;

    const measure = () => {
      frameCount++;
      const elapsed = performance.now() - startTime;
      if (elapsed >= 500) {
        const fps = (frameCount / elapsed) * 1000;
        if (fps < 30) {
          setReducedMotion(true);
        }
        return; // stop measuring
      }
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { reducedMotion };
}
