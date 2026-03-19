/**
 * SpecialCareModal.tsx
 *
 * Bottom-sheet modal that wraps <DuelCard /> for the unified funnel Slide 3.
 * Opens when the user clicks a [ + ] add-on slot for a specific facial zone.
 *
 * Performance: Uses React.memo to prevent re-renders when other slides change.
 * Theming: All colors via CSS variables — zero hardcoded hex.
 */

import { memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import DuelCard from '@/features/lab-selection/components/DuelCard';
import type { FaceZone, SkinProfile, RequiredIngredient, PriceTier, Product } from '@/features/lab-selection/types';

export interface SpecialCareModalProps {
  isOpen: boolean;
  zone: FaceZone;
  matchedProfile: SkinProfile;
  requiredIngredients: RequiredIngredient[];
  onProductSelect: (zone: FaceZone, product: Product, tier: PriceTier) => void;
  onClose: () => void;
}

const SpecialCareModal = memo(function SpecialCareModal({
  isOpen,
  zone,
  matchedProfile,
  requiredIngredients,
  onProductSelect,
  onClose,
}: SpecialCareModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleProductSelect = useCallback(
    (z: FaceZone, product: Product, tier: PriceTier) => {
      onProductSelect(z, product, tier);
      onClose();
    },
    [onProductSelect, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="special-care-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: 'hsla(var(--background) / 0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Bottom sheet */}
          <motion.div
            key="special-care-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[85vh] overflow-y-auto rounded-t-2xl"
            style={{
              background: 'hsl(var(--card))',
              borderTop: '1px solid hsl(var(--border))',
              boxShadow: '0 -8px 40px hsla(var(--foreground) / 0.1)',
            }}
          >
            {/* Handle + close */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-3 pb-2"
              style={{ background: 'hsl(var(--card))' }}
            >
              <div
                className="mx-auto h-1 w-10 rounded-full"
                style={{ background: 'hsl(var(--border))' }}
              />
              <button
                onClick={onClose}
                className="absolute right-4 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--foreground-hint))',
                }}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* DuelCard content */}
            <div className="px-4 pb-8">
              <DuelCard
                zone={zone}
                matchedProfile={matchedProfile}
                requiredIngredients={requiredIngredients}
                onProductSelect={handleProductSelect}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default SpecialCareModal;
