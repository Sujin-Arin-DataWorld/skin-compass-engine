/**
 * card-patterns.tsx
 *
 * Phase 6 Design System — Reusable card/button/badge components.
 * All Phase 6+ components should use these instead of inline styles.
 *
 * Components:
 *  - GlassCard     — default card (glassmorphism)
 *  - ElevatedCard  — popover / modal / dropdown surface
 *  - PremiumCard   — key results / Skin Age / Duel winner (gold top border)
 *  - PremiumButton — Save Routine, Enter Lab (gold gradient CTA)
 *  - SageButton    — regular actions (filled / outline / ghost)
 *  - StatusBadge   — professional safety states
 */

import React from "react";
import { cn } from "@/lib/utils";

// ─── Shared prop types ────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
// White mode: clean glass with subtle shadow
// Dark mode:  smoke glass with deep blur

export function GlassCard({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        // Light mode
        "bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm",
        // Dark mode
        "dark:bg-slate-900/50 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-2xl",
        "rounded-lg p-6 transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── ElevatedCard ─────────────────────────────────────────────────────────────
// For popovers, modals, dropdowns — highest surface in elevation hierarchy

export function ElevatedCard({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-popover/90 backdrop-blur-lg border border-border rounded-lg p-4 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── PremiumCard ──────────────────────────────────────────────────────────────
// Duel winner, Skin Age, key results — uses champagne gold top-edge border

export function PremiumCard({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg p-6 overflow-hidden",
        // Light mode
        "bg-white/70 backdrop-blur-xl shadow-gold-glow",
        // Dark mode
        "dark:bg-slate-900/60 dark:backdrop-blur-xl dark:shadow-gold-glow-dark",
        className
      )}
    >
      {/* Gold gradient border — top edge only for subtlety */}
      <div className="absolute inset-x-0 top-0 h-[2px] gold-gradient" />
      {children}
    </div>
  );
}

// ─── PremiumButton ────────────────────────────────────────────────────────────
// Save Routine, Enter Lab — key CTAs only (gold gradient surface)

export function PremiumButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-lg font-medium transition-all",
        "gold-gradient text-foreground",
        "shadow-inner-highlight",
        "hover:brightness-110 hover:shadow-gold-glow",
        "active:brightness-95 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[2.75rem]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── SageButton ───────────────────────────────────────────────────────────────
// Regular actions — navigation, secondary CTAs (3 variants)

export function SageButton({
  children,
  className,
  variant = "filled",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: "filled" | "outline" | "ghost";
}) {
  const variants = {
    filled: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-inner-highlight",
    outline: "border border-primary text-primary hover:bg-primary/10",
    ghost: "text-primary hover:bg-primary/10",
  };

  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md font-medium transition-all",
        "active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[2.75rem]",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Clinical safety states: success / warning / destructive / muted

export function StatusBadge({
  status,
  children,
}: {
  status: "success" | "warning" | "destructive" | "muted";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-success/10 text-success dark:bg-success/20",
    warning: "bg-warning/10 text-warning dark:bg-warning/20",
    destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium",
        styles[status]
      )}
    >
      {children}
    </span>
  );
}
