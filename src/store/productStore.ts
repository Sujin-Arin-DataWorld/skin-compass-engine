import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/engine/types";
import { CLINICAL_PRODUCTS } from "@/data/products";

export interface ProductState {
    products: Product[];
    updateProduct: (id: string, updates: Partial<Product>) => void;
    resetProducts: () => void;
}

export const useProductStore = create<ProductState>()(
    persist(
        (set) => ({
            products: CLINICAL_PRODUCTS,
            updateProduct: (id, updates) =>
                set((state) => ({
                    products: state.products.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                })),
            resetProducts: () => set({ products: CLINICAL_PRODUCTS }),
        }),
        {
            name: "skin-compass-products-v2",
        }
    )
);
