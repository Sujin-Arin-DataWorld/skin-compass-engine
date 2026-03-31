import { useState, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/store/cartStore";

export interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

export interface OrderRecord {
    id: string;
    created_at: string;
    status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
    total: number;
    items: OrderItem[];
    delivered_at: string | null;
}

export function useOrders() {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: { user } } = await (supabase as any).auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Fetch orders with their items via nested select (requires FK from order_items.order_id → orders.id)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("orders")
                .select("id, created_at, status, total, delivered_at, order_items(product_id, product_name, quantity, unit_price)")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) {
                const mapped: OrderRecord[] = (data as Array<{
                    id: string;
                    created_at: string;
                    status: string;
                    total: number;
                    delivered_at: string | null;
                    order_items: OrderItem[];
                }>).map((row) => ({
                    id: row.id,
                    created_at: row.created_at,
                    status: (row.status as OrderRecord["status"]) ?? "pending",
                    total: row.total,
                    items: row.order_items ?? [],
                    delivered_at: row.delivered_at ?? null,
                }));
                setOrders(mapped);
            }

            setLoading(false);
        };

        fetchOrders();
    }, []);

    /**
     * Insert one order + all cart items into Supabase.
     * Rolls back the order row if inserting items fails.
     * Returns the new order ID on success.
     */
    const placeOrder = async (
        cartItems: CartItem[]
    ): Promise<{ orderId: string | null; error: string | null }> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return { orderId: null, error: "Not authenticated" };

        const total = cartItems.reduce(
            (sum, i) => sum + (i.product.price ?? i.product.price_eur) * i.quantity,
            0
        );

        // 1 — INSERT order header
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: orderData, error: orderError } = await (supabase as any)
            .from("orders")
            .insert({ user_id: user.id, total, status: "pending" })
            .select("id, created_at, status, total")
            .single();

        if (orderError || !orderData) {
            return { orderId: null, error: orderError?.message ?? "Failed to create order" };
        }

        const orderId: string = orderData.id;

        // 2 — INSERT order items
        const itemRows: Array<{
            order_id: string;
            product_id: string;
            product_name: string;
            quantity: number;
            unit_price: number;
        }> = cartItems.map((i) => ({
            order_id: orderId,
            product_id: i.product.id,
            product_name: i.product.name.en,
            quantity: i.quantity,
            unit_price: i.product.price ?? i.product.price_eur,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: itemsError } = await (supabase as any)
            .from("order_items")
            .insert(itemRows);

        if (itemsError) {
            // Roll back orphaned order row
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("orders").delete().eq("id", orderId);
            return { orderId: null, error: itemsError.message };
        }

        // 3 — Optimistically add to local state
        const newOrder: OrderRecord = {
            id: orderId,
            created_at: orderData.created_at,
            status: "pending",
            total,
            delivered_at: null,
            items: itemRows.map(({ product_id, product_name, quantity, unit_price }) => ({
                product_id,
                product_name,
                quantity,
                unit_price,
            })),
        };
        setOrders((prev) => [newOrder, ...prev]);

        return { orderId, error: null };
    };

    return { orders, loading, placeOrder };
}
