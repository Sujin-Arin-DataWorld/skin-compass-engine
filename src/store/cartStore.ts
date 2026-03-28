import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeLocalStorage } from "@/utils/safeStorage";
import { getProductById, getRealProductPrice } from "@/engine/productBridge";
import type { Product } from "@/engine/types";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  validateCart: () => Promise<{ removedCount: number; priceUpdated: boolean }>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== id) })),

      updateQty: (id, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.product.id !== id)
              : state.items.map((i) =>
                  i.product.id === id ? { ...i, quantity: qty } : i
                ),
        })),

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + (i.product.price ?? i.product.price_eur) * i.quantity,
          0
        ),

      validateCart: async () => {
        const { items } = get();
        if (items.length === 0) return { removedCount: 0, priceUpdated: false };
        let removedCount = 0;
        let priceUpdated = false;
        const validated = items
          .filter((item) => {
            const real = getProductById(item.product.id);
            if (!real) { removedCount++; return false; }
            return true;
          })
          .map((item) => {
            const freshPrice = getRealProductPrice(item.product.id);
            if (freshPrice !== item.product.price_eur) {
              priceUpdated = true;
              return { ...item, product: { ...item.product, price_eur: freshPrice } };
            }
            return item;
          });
        if (removedCount > 0 || priceUpdated) set({ items: validated });
        return { removedCount, priceUpdated };
      },
    }),
    { name: "skin-compass-cart-v1", storage: createJSONStorage(() => safeLocalStorage) }
  )
);
