import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollAnimation } from './useScrollAnimation';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Simulate a native scroll event on `window`. */
function fireScroll(scrollY: number) {
  Object.defineProperty(window, 'scrollY', { value: scrollY, writable: true, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useScrollAnimation', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');

    // Replace rAF with synchronous execution so tests are deterministic
    let nextId = 1;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      const id = nextId++;
      cb(performance.now());
      return id;
    });
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers a passive scroll listener on mount', () => {
    const cb = vi.fn();
    renderHook(() => useScrollAnimation(cb));

    const scrollCalls = addSpy.mock.calls.filter(([type]) => type === 'scroll');
    expect(scrollCalls.length).toBe(1);
    expect(scrollCalls[0][2]).toEqual({ passive: true });
  });

  it('removes the scroll listener on unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useScrollAnimation(cb));
    unmount();

    const removeCalls = removeSpy.mock.calls.filter(([type]) => type === 'scroll');
    expect(removeCalls.length).toBe(1);
  });

  it('passes scrollY and prevScrollY to callback', () => {
    const cb = vi.fn();
    renderHook(() => useScrollAnimation(cb));

    fireScroll(100);
    expect(cb).toHaveBeenCalledWith(100, 0);

    fireScroll(250);
    expect(cb).toHaveBeenCalledWith(250, 100);
  });

  it('clamps negative scrollY to 0 (iOS rubber-band guard)', () => {
    const cb = vi.fn();
    renderHook(() => useScrollAnimation(cb));

    fireScroll(-30);
    expect(cb).toHaveBeenCalledWith(0, 0);
  });

  it('invokes callback through requestAnimationFrame', () => {
    const cb = vi.fn();
    renderHook(() => useScrollAnimation(cb));

    fireScroll(50);
    expect(rafSpy).toHaveBeenCalled();
  });

  it('cancels pending rAF on rapid successive scrolls', () => {
    // Use a non-executing rAF to test cancellation
    let storedCb: ((time: number) => void) | null = null;
    let frameId = 100;
    rafSpy.mockImplementation((cb: FrameRequestCallback) => {
      storedCb = cb;
      return ++frameId;
    });

    const cb = vi.fn();
    renderHook(() => useScrollAnimation(cb));

    // First scroll schedules rAF
    fireScroll(50);
    expect(cafSpy).not.toHaveBeenCalled();

    // Second scroll cancels previous rAF and schedules new one
    fireScroll(80);
    expect(cafSpy).toHaveBeenCalled();

    // Execute the latest rAF callback
    if (storedCb) (storedCb as FrameRequestCallback)(performance.now());
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(80, 0);
  });

  it('cleans up pending rAF on unmount', () => {
    // Use a non-executing rAF
    rafSpy.mockImplementation(() => 42);

    const cb = vi.fn();
    const { unmount } = renderHook(() => useScrollAnimation(cb));

    fireScroll(50);
    unmount();

    expect(cafSpy).toHaveBeenCalledWith(42);
  });
});
