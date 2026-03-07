import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";

// Shape of a row in the `profiles` table
interface SupabaseProfile {
    id: string;
    full_name: string | null;
    phone: string | null;
    birth_date: string | null;
    skin_type: string | null;
    avatar_url: string | null;
}

export interface ProfileUpdates {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string;
    skinType?: string;
}

export function useProfile() {
    const [profile, setProfile] = useState<SupabaseProfile | null>(null);
    const [loading, setLoading] = useState(true);
    // Keep local Zustand state in sync after DB write
    const syncLocal = useAuthStore((s) => s.updateProfile);

    useEffect(() => {
        const fetchProfile = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: { user } } = await (supabase as any).auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("profiles")
                .select("id, full_name, phone, birth_date, skin_type, avatar_url")
                .eq("id", user.id)
                .single();

            setProfile((data as SupabaseProfile) ?? null);
            setLoading(false);
        };

        fetchProfile();
    }, []);

    /**
     * Write profile changes to Supabase, then sync the Zustand store.
     * firstName / lastName are combined into `full_name` in the DB.
     */
    const updateProfile = async (updates: ProfileUpdates): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const dbRow: Record<string, string | null> = {
            updated_at: new Date().toISOString(),
        };

        // Merge first/last name into full_name
        if (updates.firstName !== undefined || updates.lastName !== undefined) {
            const currentParts = (profile?.full_name ?? "").split(" ");
            const first = updates.firstName ?? currentParts[0] ?? "";
            const last = updates.lastName ?? currentParts.slice(1).join(" ") ?? "";
            dbRow.full_name = `${first} ${last}`.trim();
        }
        if (updates.phone !== undefined) dbRow.phone = updates.phone;
        if (updates.birthDate !== undefined) dbRow.birth_date = updates.birthDate;
        if (updates.skinType !== undefined) dbRow.skin_type = updates.skinType;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from("profiles")
            .update(dbRow)
            .eq("id", user.id)
            .select("id, full_name, phone, birth_date, skin_type, avatar_url")
            .single();

        if (!error && data) {
            setProfile(data as SupabaseProfile);
            // Keep Zustand UserProfile in sync so Navbar/UI reflects new name immediately
            if (updates.firstName !== undefined || updates.lastName !== undefined) {
                syncLocal({
                    firstName: updates.firstName ?? (profile?.full_name?.split(" ")[0] ?? ""),
                    lastName: updates.lastName ?? (profile?.full_name?.split(" ").slice(1).join(" ") ?? ""),
                });
            }
        }

        return { error: error?.message ?? null };
    };

    /** Change password via Supabase Auth */
    const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).auth.updateUser({ password: newPassword });
        return { error: error?.message ?? null };
    };

    return { profile, loading, updateProfile, updatePassword };
}
