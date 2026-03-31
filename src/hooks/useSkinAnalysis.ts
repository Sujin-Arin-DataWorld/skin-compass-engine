import { useState, useEffect } from "react";
// Use 'any' cast because analysis_history is not yet in the auto-generated types.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisRecord {
    id: string;
    analyzed_at: string;
    radar_data: Record<string, number>;
    skin_tier: string;
    recommended_products: Array<{ id: string; name: string; phase: string }>;
    notes?: string;
}

// @deprecated alias removed — AnalysisRecord is already exported above.

export function useSkinAnalysis() {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
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
                .from("analysis_history")
                .select("id, analyzed_at, radar_data, skin_tier, recommended_products, notes")
                .eq("user_id", user.id)
                .order("analyzed_at", { ascending: false });

            setHistory((data as AnalysisRecord[]) ?? []);
            setLoading(false);
        };

        fetchHistory();
    }, []);

    const saveAnalysis = async (
        radarData: Record<string, number>,
        skinTier: string,
        recommendedProducts: Array<{ id: string; name: string; phase: string }>
    ): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from("analysis_history")
            .insert({
                user_id: user.id,
                radar_data: radarData,
                skin_tier: skinTier,
                recommended_products: recommendedProducts,
            })
            .select("id, analyzed_at, radar_data, skin_tier, recommended_products, notes")
            .single();

        if (!error && data) {
            setHistory((prev) => [data as AnalysisRecord, ...prev]);
        }
        return { error: error?.message ?? null };
    };

    return { history, loading, saveAnalysis };
}

/** @deprecated Use useSkinAnalysis instead. */
export const useAnalysis = useSkinAnalysis;
