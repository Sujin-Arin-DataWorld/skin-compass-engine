/**
 * Typography.tsx
 *
 * Design-system typography component.
 * Maps semantic variants to the CSS custom-property token system
 * defined in src/index.css and tailwind.config.ts.
 *
 * CRITICAL: The 'data' variant always uses font-numeric (Plus Jakarta Sans)
 * regardless of language setting. Score values, percentages, axis numbers,
 * UV index — these must NEVER render in SUIT or Hahmlet.
 */

import type { ElementType, ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type TypographyVariant = "hero" | "section" | "sub" | "body" | "ui" | "data" | "label";

// Maps each variant to Tailwind font-* + text-* classes
const VARIANT_CLASSES: Record<TypographyVariant, string> = {
  hero:    "font-display  text-hero",
  section: "font-display  text-section",
  sub:     "font-sans     text-sub",
  body:    "font-sans     text-body",
  ui:      "font-sans     text-ui",
  data:    "font-numeric  text-data    tabular-nums",  // always Plus Jakarta Sans
  label:   "font-sans     text-label   uppercase",
};

// Default HTML element per variant
const DEFAULT_TAG: Record<TypographyVariant, ElementType> = {
  hero:    "h1",
  section: "h2",
  sub:     "h3",
  body:    "p",
  ui:      "span",
  data:    "span",
  label:   "span",
};

type TypographyProps<T extends ElementType = "p"> = {
  variant: TypographyVariant;
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "variant" | "className">;

export function Typography<T extends ElementType = "p">({
  variant,
  as,
  className,
  ...props
}: TypographyProps<T>) {
  const Tag = (as ?? DEFAULT_TAG[variant]) as ElementType;
  return (
    <Tag
      className={cn(VARIANT_CLASSES[variant], className)}
      {...props}
    />
  );
}

export default Typography;
