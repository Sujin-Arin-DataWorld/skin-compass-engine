import { useState, useEffect } from "react";
// Use 'any' cast because diagnosis_history is not yet in the auto-generated types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";

export interface DiagnosisRecord {
    id: string;
    diagnosed_at: string;
    radar_data: Record<string, number>;
    skin_tier: string;
    recommended_products: Array<{ id: string; name: string; phase: string }>;
    notes?: string;
}

export function useDiagnosis() {
    const [history, setHistory] = useState<DiagnosisRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: { user } } = await (supabase as any).auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("diagnosis_history")
                .select("id, diagnosed_at, radar_data, skin_tier, recommended_products, notes")
                .eq("user_id", user.id)
                .order("diagnosed_at", { ascending: false });

            setHistory((data as DiagnosisRecord[]) ?? []);
            setLoading(false);
        };

        fetchHistory();
    }, []);

    const saveDiagnosis = async (
        radarData: Record<string, number>,
        skinTier: string,
        recommendedProducts: Array<{ id: string; name: string; phase: string }>
    ): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from("diagnosis_history")
            .insert({
                user_id: user.id,
                radar_data: radarData,
                skin_tier: skinTier,
                recommended_products: recommendedProducts,
            })
            .select("id, diagnosed_at, radar_data, skin_tier, recommended_products, notes")
            .single();

        if (!error && data) {
            setHistory((prev) => [data as DiagnosisRecord, ...prev]);
        }
        return { error: error?.message ?? null };
    };

    return { history, loading, saveDiagnosis };
}
