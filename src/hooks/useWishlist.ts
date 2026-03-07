import { useState, useEffect, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";

export interface WishlistItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    price: number | null;
    added_at: string;
}

export type WishlistProductInput = Omit<WishlistItem, "id" | "added_at">;

export function useWishlist() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: { user } } = await (supabase as any).auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("wishlist")
                .select("id, product_id, product_name, product_image, price, added_at")
                .eq("user_id", user.id)
                .order("added_at", { ascending: false });

            setItems((data as WishlistItem[]) ?? []);
            setLoading(false);
        };

        fetchWishlist();
    }, []);

    /**
     * Toggle a product in/out of the wishlist.
     * Uses optimistic UI: state is updated immediately and reverted on error.
     */
    const toggle = useCallback(async (product: WishlistProductInput) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return;

        const existing = items.find((i) => i.product_id === product.product_id);

        if (existing) {
            // ── Remove ───────────────────────────────────────────────────────────
            // Optimistic: remove immediately
            setItems((prev) => prev.filter((i) => i.product_id !== product.product_id));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from("wishlist")
                .delete()
                .eq("id", existing.id);

            // Revert on DB error
            if (error) {
                setItems((prev) => [existing, ...prev]);
            }
        } else {
            // ── Add ──────────────────────────────────────────────────────────────
            // Optimistic: add immediately with a temp id
            const tempItem: WishlistItem = {
                ...product,
                id: `temp_${Date.now()}`,
                added_at: new Date().toISOString(),
            };
            setItems((prev) => [tempItem, ...prev]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("wishlist")
                .insert({ user_id: user.id, ...product })
                .select("id, product_id, product_name, product_image, price, added_at")
                .single();

            if (error) {
                // Revert on DB error (UNIQUE violation or network failure)
                setItems((prev) => prev.filter((i) => i.id !== tempItem.id));
            } else if (data) {
                // Replace temp id with real DB id
                setItems((prev) =>
                    prev.map((i) => (i.id === tempItem.id ? (data as WishlistItem) : i))
                );
            }
        }
    }, [items]);

    /** Reactive boolean — suitable as a prop to product card components */
    const isWished = useCallback((productId: string): boolean => {
        return items.some((i) => i.product_id === productId);
    }, [items]);

    return { items, loading, toggle, isWished };
}
