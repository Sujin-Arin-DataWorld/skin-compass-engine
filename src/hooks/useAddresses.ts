import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";

export interface ShippingAddress {
    id: string;
    label: string;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    is_default: boolean;
    phone?: string | null;
    created_at: string;
}

export type AddressInput = Omit<ShippingAddress, "id" | "is_default" | "created_at">;

export function useAddresses() {
    const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddresses = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: { user } } = await (supabase as any).auth.getUser();
            if (!user) { setLoading(false); return; }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("shipping_addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false })
                .order("created_at", { ascending: false });

            setAddresses((data as ShippingAddress[]) ?? []);
            setLoading(false);
        };
        fetchAddresses();
    }, []);

    const addAddress = async (input: AddressInput): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        const isFirst = addresses.length === 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from("shipping_addresses")
            .insert({ ...input, user_id: user.id, is_default: isFirst })
            .select("*")
            .single();

        if (!error && data) {
            setAddresses((prev) =>
                isFirst ? [data as ShippingAddress] : [...prev, data as ShippingAddress]
            );
        }
        return { error: error?.message ?? null };
    };

    const updateAddress = async (
        id: string,
        input: Partial<AddressInput>
    ): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
            .from("shipping_addresses")
            .update(input)
            .eq("id", id)
            .eq("user_id", user.id)
            .select("*")
            .single();

        if (!error && data) {
            setAddresses((prev) =>
                prev.map((a) => (a.id === id ? (data as ShippingAddress) : a))
            );
        }
        return { error: error?.message ?? null };
    };

    const deleteAddress = async (id: string): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from("shipping_addresses")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (!error) setAddresses((prev) => prev.filter((a) => a.id !== id));
        return { error: error?.message ?? null };
    };

    const setDefault = async (id: string): Promise<{ error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { error: "Not authenticated" };

        // Clear existing default for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
            .from("shipping_addresses")
            .update({ is_default: false })
            .eq("user_id", user.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from("shipping_addresses")
            .update({ is_default: true })
            .eq("id", id)
            .eq("user_id", user.id);

        if (!error) {
            setAddresses((prev) =>
                prev.map((a) => ({ ...a, is_default: a.id === id }))
            );
        }
        return { error: error?.message ?? null };
    };

    return { addresses, loading, addAddress, updateAddress, deleteAddress, setDefault };
}
