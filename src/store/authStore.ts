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
    firstName: string;
    lastName: string;
    email: string;
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
    logout: () => void;
    updateProfile: (updates: Partial<Pick<UserProfile, "firstName" | "lastName">>) => void;
    saveDiagnosisResult: (result: DiagnosisResult) => void;
    addAddress: (address: Address) => void;
    removeAddress: (id: string) => void;
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
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
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
                        firstName: "Admin",
                        lastName: "",
                        email: ADMIN_EMAIL,
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
                    firstName: "User",
                    lastName: "",
                    email,
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
        }),
        { name: "skin-strategy-auth" }
    )
);
