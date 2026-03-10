import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosisResult } from "@/engine/types";

export interface Address {
    id: string;
    label: string;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
}

export interface UserProfile {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    provider: "email" | "google";
    role: "user" | "admin";
    createdAt: string;
    savedResults: DiagnosisResult[];
    addresses: Address[];
}

interface AuthState {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;

    // Called by onAuthStateChange in App.tsx to keep store in sync
    setSession: (user: User | null) => void;

    signup: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
    login: (email: string, password: string) => Promise<boolean>;
    loginWithGoogle: (redirectPath?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<Pick<UserProfile, "firstName" | "lastName">>) => void;
    saveDiagnosisResult: (result: DiagnosisResult) => void;
    addAddress: (address: Address) => void;
    removeAddress: (id: string) => void;
}

// Maps a Supabase User to our UserProfile shape.
// Preserves locally-stored data (savedResults, addresses)
// when the same user re-authenticates.
function buildProfile(user: User, existing?: UserProfile | null): UserProfile {
    const isSameUser = existing?.userId === user.id;
    const meta = user.user_metadata ?? {};
    const appMeta = user.app_metadata ?? {};

    // Google users send full_name; email signup sends first_name/last_name
    const firstName = meta.first_name ?? meta.full_name?.split(" ")[0] ?? "";
    const lastName = meta.last_name ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "";

    return {
        userId: user.id,
        firstName,
        lastName,
        email: user.email ?? "",
        avatar: meta.avatar_url,
        provider: appMeta.provider === "google" ? "google" : "email",
        // role is set in Supabase app_metadata via Dashboard/Admin API — never by the user
        role: appMeta.role === "admin" ? "admin" : "user",
        createdAt: user.created_at,
        savedResults: isSameUser ? existing!.savedResults : [],
        addresses: isSameUser ? existing!.addresses : [],
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
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                // onAuthStateChange in App.tsx handles updating the store on success
                return !error;
            },

            loginWithGoogle: async (redirectPath = "/account") => {
                // Encode the post-auth destination into the redirectTo URL so it
                // survives the OAuth round-trip. The target page reads ?redirect=.
                const encodedRedirect = encodeURIComponent(redirectPath);
                await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        // NOTE: add <origin>/account to Supabase Auth → Allowed Redirect URLs
                        redirectTo: `${window.location.origin}/account?redirect=${encodedRedirect}`,
                        queryParams: {
                            prompt: "select_account",
                            access_type: "offline",
                        },
                    },
                });
                // Browser redirects away — no further action needed here
            },

            logout: async () => {
                // 1. Sign out from Supabase first — invalidates the server session.
                await supabase.auth.signOut();
                // 2. Wipe both Zustand persist slices from localStorage so the next
                //    browser session (or a different user) starts completely clean.
                localStorage.removeItem("skin-strategy-auth");
                localStorage.removeItem("skin-diagnosis-store");
                // 3. Reset in-memory state as a safety net (in case navigation is delayed).
                set({ isLoggedIn: false, userProfile: null });
                // 4. Hard redirect — a full page reload guarantees all React state is gone.
                window.location.href = "/";
            },

            updateProfile: (updates) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({ userProfile: { ...profile, ...updates } });
            },

            saveDiagnosisResult: (result) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({
                    userProfile: {
                        ...profile,
                        savedResults: [result, ...profile.savedResults].slice(0, 20),
                    },
                });
            },

            addAddress: (address) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({ userProfile: { ...profile, addresses: [...profile.addresses, address] } });
            },

            removeAddress: (id) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({ userProfile: { ...profile, addresses: profile.addresses.filter((a) => a.id !== id) } });
            },

        }),
        { name: "skin-strategy-auth" }
    )
);
