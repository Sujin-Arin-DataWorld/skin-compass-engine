import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export interface Order {
    id: string;
    date: string;
    status: "pending" | "shipped" | "delivered";
    total: number;
    items: { name: string; qty: number; price: number }[];
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
    orderHistory: Order[];
}

// All registered users live here (mock multi-user DB)
interface AuthState {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    allUsers: UserProfile[];

    signup: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
    login: (email: string, password: string) => boolean;
    loginWithGoogle: () => void;
    logout: () => void;
    updateProfile: (updates: Partial<Pick<UserProfile, "firstName" | "lastName">>) => void;
    saveDiagnosisResult: (result: DiagnosisResult) => void;
    addAddress: (address: Address) => void;
    removeAddress: (id: string) => void;
    purchaseProduct: (product: { name: { en: string; de: string }; price: number }) => void;
}

const ADMIN_EMAIL = "admin@skinstrategylab.de";
const ADMIN_PASSWORD = "admin123";

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            userProfile: null,
            allUsers: [],

            signup: (data) => {
                const profile: UserProfile = {
                    userId: `usr_${Math.random().toString(36).substring(2, 9)}`,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    provider: "email",
                    role: "user",
                    createdAt: new Date().toISOString(),
                    savedResults: [],
                    addresses: [],
                    orderHistory: [],
                };
                const existing = get().allUsers;
                set({
                    isLoggedIn: true,
                    userProfile: profile,
                    allUsers: [...existing.filter((u) => u.email !== data.email), profile],
                });
            },

            login: (email: string, password: string) => {
                // Admin shortcut
                if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                    const adminProfile: UserProfile = {
                        userId: "admin_001",
                        firstName: "Admin",
                        lastName: "",
                        email: ADMIN_EMAIL,
                        provider: "email",
                        role: "admin",
                        createdAt: new Date().toISOString(),
                        savedResults: [],
                        addresses: [],
                        orderHistory: [],
                    };
                    set({ isLoggedIn: true, userProfile: adminProfile });
                    return true;
                }

                // Find existing user
                const found = get().allUsers.find((u) => u.email === email);
                if (found) {
                    set({ isLoggedIn: true, userProfile: found });
                    return true;
                }

                // New user (demo mode)
                const profile: UserProfile = {
                    userId: `usr_${Math.random().toString(36).substring(2, 9)}`,
                    firstName: "User",
                    lastName: "",
                    email,
                    provider: "email",
                    role: "user",
                    createdAt: new Date().toISOString(),
                    savedResults: [],
                    addresses: [],
                    orderHistory: [],
                };
                set({
                    isLoggedIn: true,
                    userProfile: profile,
                    allUsers: [...get().allUsers, profile],
                });
                return true;
            },

            loginWithGoogle: () => {
                const googleEmail = "user@gmail.com";
                // Find existing Google user
                const found = get().allUsers.find((u) => u.email === googleEmail);
                if (found) {
                    set({ isLoggedIn: true, userProfile: found });
                    return;
                }

                // Fake Google Authentication response
                const profile: UserProfile = {
                    userId: `usr_${Math.random().toString(36).substring(2, 9)}`,
                    firstName: "Google",
                    lastName: "User",
                    email: googleEmail,
                    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                    provider: "google",
                    role: "user",
                    createdAt: new Date().toISOString(),
                    savedResults: [],
                    addresses: [],
                    orderHistory: [],
                };
                set({
                    isLoggedIn: true,
                    userProfile: profile,
                    allUsers: [...get().allUsers, profile],
                });
            },

            logout: () => {
                // Sync current profile back to allUsers before logging out
                const { userProfile, allUsers } = get();
                if (userProfile) {
                    set({
                        isLoggedIn: false,
                        userProfile: null,
                        allUsers: allUsers.map((u) => (u.email === userProfile.email ? userProfile : u)),
                    });
                } else {
                    set({ isLoggedIn: false, userProfile: null });
                }
            },

            updateProfile: (updates) => {
                const profile = get().userProfile;
                if (!profile) return;
                set({ userProfile: { ...profile, ...updates } });
            },

            saveDiagnosisResult: (result) => {
                const profile = get().userProfile;
                if (!profile) return;
                const updated = {
                    ...profile,
                    savedResults: [result, ...profile.savedResults].slice(0, 20),
                };
                // Sync to allUsers as well
                set({
                    userProfile: updated,
                    allUsers: get().allUsers.map((u) => (u.email === updated.email ? updated : u)),
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

            purchaseProduct: (product) => {
                const profile = get().userProfile;
                if (!profile) return;

                const newOrder: Order = {
                    id: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    date: new Date().toISOString(),
                    status: "pending",
                    total: product.price,
                    items: [{ name: product.name.en, qty: 1, price: product.price }]
                };

                const updated = {
                    ...profile,
                    orderHistory: [newOrder, ...profile.orderHistory]
                };

                set({
                    userProfile: updated,
                    allUsers: get().allUsers.map((u) => (u.email === updated.email ? updated : u)),
                });
            },
        }),
        { name: "skin-strategy-auth" }
    )
);
