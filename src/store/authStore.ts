/**
 * authStore.ts — Authentication & Session Management (Single Responsibility)
 *
 * ⚡ Role: Auth state (login/logout/session) + lightweight Navbar profile cache.
 * ⚡ NOT responsible for: addresses (→ useAddresses), analysis history (→ useAnalysis),
 *    detailed profile data (→ useProfile). Those live in their dedicated Supabase hooks.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStorage } from "@/utils/safeStorage";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSkinProfileStore } from "./useSkinProfileStore";
import { useCartStore } from "./cartStore";

// ── Lightweight profile shape — only what Navbar/UI needs from memory ────────
export interface UserProfile {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    provider: "email" | "google";
    role: "user" | "admin";
    createdAt: string;
}

interface AuthState {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;

    // Called by onAuthStateChange in App.tsx to keep store in sync
    setSession: (user: User | null) => void;

    signup: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
    login: (email: string, password: string) => Promise<boolean>;
    loginWithGoogle: (redirectPath?: string) => Promise<void>;
    loginWithGooglePopup: (popup: Window) => Promise<void>;
    logout: () => Promise<void>;

    // Local-only sync target — useProfile hook writes to DB first, then calls this
    // to keep Navbar/UI firstName/lastName in sync without a full page reload.
    updateProfile: (updates: Partial<Pick<UserProfile, "firstName" | "lastName">>) => void;
}

// Maps a Supabase User to our lightweight UserProfile shape.
function buildProfile(user: User, existing?: UserProfile | null): UserProfile {
    const isSameUser = existing?.userId === user.id;
    const meta = user.user_metadata ?? {};
    const appMeta = user.app_metadata ?? {};

    // Google users send full_name; email signup sends first_name/last_name
    const firstName = isSameUser && existing!.firstName
        ? existing!.firstName
        : (meta.first_name ?? meta.full_name?.split(" ")[0] ?? "");
    const lastName = isSameUser && existing!.lastName
        ? existing!.lastName
        : (meta.last_name ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "");

    return {
        userId: user.id,
        firstName,
        lastName,
        email: user.email ?? "",
        avatar: meta.avatar_url,
        provider: appMeta.provider === "google" ? "google" : "email",
        role: appMeta.role === "admin" ? "admin" : "user",
        createdAt: user.created_at,
    };
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            userProfile: null,

            setSession: (user) => {
                if (!user) {
                    set({ isLoggedIn: false, userProfile: null });
                    return;
                }
                const profile = buildProfile(user, get().userProfile);
                set({ isLoggedIn: true, userProfile: profile });
            },

            signup: async ({ firstName, lastName, email, password }) => {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { first_name: firstName, last_name: lastName },
                    },
                });

                if (error) return { error: error.message, needsEmailConfirmation: false };

                // No session means Supabase requires email confirmation
                const needsEmailConfirmation = !data.session;
                return { error: null, needsEmailConfirmation };
            },

            login: async (email, password) => {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                // Eagerly set session so Zustand isLoggedIn=true before navigate() fires
                if (data.user) get().setSession(data.user);
                return !error;
            },

            loginWithGoogle: async (redirectPath = "/account") => {
                const encodedRedirect = encodeURIComponent(redirectPath);
                await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodedRedirect}`,
                        queryParams: {
                            prompt: "select_account",
                            access_type: "offline",
                        },
                    },
                });
            },

            // Popup-based Google OAuth: opens login in a popup window
            // so the parent page is never navigated away.
            loginWithGooglePopup: async (popup: Window) => {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        skipBrowserRedirect: true,
                        redirectTo: `${window.location.origin}/auth/callback?popup=true`,
                        queryParams: {
                            prompt: "select_account",
                            access_type: "offline",
                        },
                    },
                });
                if (error || !data?.url) {
                    popup.close();
                    throw error || new Error('No OAuth URL returned');
                }
                popup.location.href = data.url;
            },

            logout: async () => {
                // 1. Sign out with 3s timeout — mobile networks can stall TCP connections
                //    indefinitely (no throw, no resolve), blocking window.location.href forever.
                try {
                    await Promise.race([
                        supabase.auth.signOut(),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('signOut timeout')), 3000)
                        ),
                    ]);
                } catch (e) {
                    console.warn('[authStore] signOut() failed or timed out:', e);
                }

                // 2. Clear all Zustand in-memory state FIRST (before localStorage)
                set({ isLoggedIn: false, userProfile: null });
                try { useCartStore.getState().clear(); } catch { /* safe */ }
                try { useSkinProfileStore.getState().clearProfile(); } catch { /* safe */ }

                // 3. Nuke persisted localStorage keys (app keys + Supabase sb-* session keys)
                try {
                    localStorage.removeItem("skin-strategy-auth");
                    localStorage.removeItem("skin-analysis-store");
                    localStorage.removeItem("skin-compass-cart-v1");
                    localStorage.removeItem("skin-compass-products-v2");
                    localStorage.removeItem("ssl_analysis_progress");
                    // Belt-and-suspenders: force-clear Supabase session even if signOut timed out
                    Object.keys(localStorage).forEach(k => {
                        if (k.startsWith('sb-')) localStorage.removeItem(k);
                    });
                } catch {
                    // Safari Private Mode safe
                }

                // 4. Hard redirect — guaranteed to fire regardless of errors above
                window.location.href = "/";
            },

            // Sync target for useProfile hook — keeps Navbar name fresh after DB write.
            updateProfile: (updates) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({ userProfile: { ...profile, ...updates } });
            },
        }),
        {
            name: "skin-strategy-auth",
            storage: createJSONStorage(() => safeStorage),
            version: 2,
            migrate: (persistedState: unknown, version: number) => {
                try {
                    const state = (persistedState ?? {}) as Record<string, unknown>;
                    if (version < 2) {
                        // Remove dead fields from old authStore versions (addresses, savedResults)
                        delete state.addresses;
                        delete state.savedResults;
                    }
                    return state;
                } catch {
                    // Corrupted localStorage → return clean initial state to prevent WSOD
                    return { isLoggedIn: false, userProfile: null };
                }
            },
        }
    )
);
