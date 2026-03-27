/**
 * safeStorage.ts
 *
 * Centralized wrappers for localStorage and sessionStorage that degrade
 * gracefully in environments where the Storage API throws:
 *   - SecurityError  (Safari/Firefox Private Mode, cross-origin iframes)
 *   - QuotaExceededError  (storage full)
 *
 * In those cases an in-memory fallback is used silently, preventing WSOD.
 *
 * Usage:
 *   import { safeLocalStorage, safeSessionStorage } from "@/utils/safeStorage";
 *
 *   // Drop-in replacement for localStorage / sessionStorage
 *   safeLocalStorage.setItem("key", "value");
 *   safeSessionStorage.getItem("key");
 *
 *   // For Zustand persist middleware:
 *   import { createJSONStorage } from "zustand/middleware";
 *   storage: createJSONStorage(() => safeLocalStorage)
 */

/* ── In-memory fallback stores ────────────────────────────────────────────── */

const _localMem: Record<string, string> = {};
const _sessionMem: Record<string, string> = {};

/* ── Factory ──────────────────────────────────────────────────────────────── */

function createSafeStorage(
    nativeGetter: () => Storage,
    memFallback: Record<string, string>,
): Storage {
    /** Probe: can we actually read/write the native storage? */
    function isAvailable(): boolean {
        try {
            const storage = nativeGetter();
            const k = "__ssl_storage_test__";
            storage.setItem(k, "1");
            storage.removeItem(k);
            return true;
        } catch {
            return false;
        }
    }

    const useNative = isAvailable();

    if (useNative) {
        // Even when available at boot, individual calls can still throw
        // (e.g. QuotaExceededError), so wrap each method.
        const storage = nativeGetter();
        return {
            get length() { try { return storage.length; } catch { return Object.keys(memFallback).length; } },
            key(index: number) { try { return storage.key(index); } catch { return Object.keys(memFallback)[index] ?? null; } },
            getItem(k: string) { try { return storage.getItem(k); } catch { return memFallback[k] ?? null; } },
            setItem(k: string, v: string) { try { storage.setItem(k, v); } catch { memFallback[k] = v; } },
            removeItem(k: string) { try { storage.removeItem(k); } catch { delete memFallback[k]; } },
            clear() { try { storage.clear(); } catch { Object.keys(memFallback).forEach(k => delete memFallback[k]); } },
        };
    }

    // Fully in-memory — private browsing / sandboxed environment
    return {
        get length() { return Object.keys(memFallback).length; },
        key: (i: number) => Object.keys(memFallback)[i] ?? null,
        getItem: (k: string) => memFallback[k] ?? null,
        setItem: (k: string, v: string) => { memFallback[k] = v; },
        removeItem: (k: string) => { delete memFallback[k]; },
        clear: () => { Object.keys(memFallback).forEach(k => delete memFallback[k]); },
    };
}

/* ── Exports ──────────────────────────────────────────────────────────────── */

export const safeLocalStorage: Storage = createSafeStorage(
    () => window.localStorage,
    _localMem,
);

export const safeSessionStorage: Storage = createSafeStorage(
    () => window.sessionStorage,
    _sessionMem,
);

/** @deprecated Use `safeLocalStorage` instead. Kept for backward compat. */
export const safeStorage = safeLocalStorage;
