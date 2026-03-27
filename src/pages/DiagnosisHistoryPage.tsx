/**
 * DiagnosisHistoryPage
 * Rendered when ?tab=history inside /account.
 *
 * Sections:
 *  1. Progression LineChart with toggleable axis legend + 90-day re-analyze CTA
 *  2. Comparison overlay — triggered when exactly 2 diagnoses are checked
 *  3. Diagnosis archive — expandable cards with full RadarChart + products
 *  4. Empty state for new users
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { ChevronDown, ChevronUp, X, FlaskConical } from "lucide-react";
import { useDiagnosis, type DiagnosisRecord } from "@/hooks/useDiagnosis";
import { RADAR_AXES, AXIS_LABELS, AXIS_LABELS_DE, type AxisKey } from "@/engine/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

/** 10 perceptually distinct colours for the 10 axes — readable on dark BG */
const AXIS_COLORS: Record<string, string> = {
    seb: "var(--ssl-accent)",
    hyd: "#60A5FA",
    bar: "#4ADE80",
    sen: "#F472B6",
    ox: "#FB923C",
    acne: "#EF4444",
    pigment: "#C084FC",
    texture: "#38BDF8",
    aging: "#A78BFA",
    makeup_stability: "#34D399",
};

const TIER_BADGE: Record<string, { bg: string; color: string }> = {
    Entry: { bg: "rgba(148,126,92,0.15)", color: BRONZE },
    Advanced: { bg: "rgba(45,107,74,0.12)", color: GOLD },
    Full: { bg: "rgba(45,107,74,0.12)", color: GOLD },
    Clinical: { bg: "rgba(255,255,255,0.07)", color: "#e8e8e8" },
    Premium: { bg: "rgba(255,255,255,0.07)", color: "#e8e8e8" },
};

const CARD: React.CSSProperties = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(45,107,74,0.12)",
    borderRadius: "14px",
};

// ── Shared helpers ────────────────────────────────────────────────────────────
function SectionHead({ children }: { children: React.ReactNode }) {
    return (
        <p style={{
            fontSize: "0.6rem", letterSpacing: "0.28em",
            color: GOLD, textTransform: "uppercase", fontWeight: 600,
            marginBottom: "0.5rem",
        }}>
            {children}
        </p>
    );
}

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "#111",
            border: "1px solid rgba(45,107,74,0.2)",
            borderRadius: "8px",
            padding: "0.5rem 0.75rem",
            fontSize: "0.7rem",
            maxWidth: "200px",
        }}>
            <p style={{ color: GOLD, marginBottom: "0.35rem", fontFamily: "monospace" }}>{label}</p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {payload.map((entry: any) => (
                <p key={entry.dataKey} style={{ color: entry.stroke, lineHeight: 1.7 }}>
                    {entry.name}:{" "}
                    <span style={{ fontWeight: 600 }}>{entry.value}</span>
                </p>
            ))}
        </div>
    );
}

// ── MiniRadar — no labels, no tooltips, purely visual ────────────────────────
function MiniRadar({ data }: { data: { axis: string; score: number }[] }) {
    return (
        <ResponsiveContainer width={72} height={72}>
            <RadarChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" radialLines={false} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    dataKey="score"
                    stroke={GOLD}
                    fill={GOLD}
                    fillOpacity={0.18}
                    strokeWidth={1.2}
                    dot={false}
                    isAnimationActive={false}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// ── FullRadar — labelled, animated ───────────────────────────────────────────
function FullRadar({ data }: { data: { axis: string; score: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data} margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: BRONZE, fontSize: 8, fontFamily: "inherit" }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                    dataKey="score"
                    stroke={GOLD}
                    fill={GOLD}
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                    dot={{ fill: GOLD, r: 2.5, strokeWidth: 0 }}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// ── ComparisonRadar — two datasets overlaid ───────────────────────────────────
function ComparisonRadar({
    data,
    newerLabel,
    olderLabel,
}: {
    data: { axis: string; newer: number; older: number }[];
    newerLabel: string;
    olderLabel: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} margin={{ top: 16, right: 28, bottom: 16, left: 28 }}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fill: BRONZE, fontSize: 8, fontFamily: "inherit" }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {/* Newer — Gold, solid fill */}
                <Radar
                    name={newerLabel}
                    dataKey="newer"
                    stroke={GOLD}
                    fill={GOLD}
                    fillOpacity={0.14}
                    strokeWidth={1.5}
                />
                {/* Older — Bronze, dashed stroke, near-invisible fill */}
                <Radar
                    name={olderLabel}
                    dataKey="older"
                    stroke={BRONZE}
                    fill={BRONZE}
                    fillOpacity={0.04}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                />
            </RadarChart>
        </ResponsiveContainer>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ de }: { de: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-16 px-6 rounded-2xl"
            style={{
                background: "rgba(10,10,10,0.8)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(45,107,74,0.12)",
            }}
        >
            <div
                className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                    background: "rgba(45,107,74,0.07)",
                    border: "1px solid rgba(45,107,74,0.15)",
                }}
            >
                <FlaskConical className="w-7 h-7" style={{ color: GOLD }} strokeWidth={1} />
            </div>
            <p style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                color: "#e8e8e8",
                marginBottom: "0.5rem",
            }}>
                {de ? "Beginnen Sie Ihre Hautreise" : "Begin Your Skin Journey"}
            </p>
            <p style={{
                fontSize: "0.8125rem",
                color: BRONZE,
                lineHeight: 1.65,
                maxWidth: "280px",
                margin: "0 auto 1.5rem",
            }}>
                {de
                    ? "Starten Sie Ihre wissenschaftliche Analyse, um die Daten Ihrer Haut freizuschalten."
                    : "Start your scientific diagnosis to unlock your skin's data."
                }
            </p>
            <Link
                to="/diagnosis"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: GOLD, color: "#F5F5F7" }}
            >
                <FlaskConical className="w-4 h-4" strokeWidth={1.5} />
                {de ? "Analyse starten" : "Start Analysis"}
            </Link>
        </motion.div>
    );
}

// ── DiagnosisCard ─────────────────────────────────────────────────────────────
function DiagnosisCard({
    record,
    de,
    isExpanded,
    onToggle,
    isSelected,
    onToggleCompare,
    compareDisabled,
    axisLabels,
}: {
    record: DiagnosisRecord;
    de: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    isSelected: boolean;
    onToggleCompare: () => void;
    compareDisabled: boolean;
    axisLabels: Record<string, string>;
}) {
    const badge = TIER_BADGE[record.skin_tier] ?? TIER_BADGE.Entry;

    const radarData = RADAR_AXES.map((key) => ({
        axis: axisLabels[key as AxisKey] ?? key,
        score: Math.round(record.radar_data[key] ?? 0),
        fullMark: 100,
    }));

    const formattedDate = new Date(record.diagnosed_at).toLocaleDateString(
        de ? "de-DE" : "en-GB",
        { day: "2-digit", month: "long", year: "numeric" }
    );

    return (
        <motion.div layout style={CARD} className="overflow-hidden">
            {/* Closed header row — always visible */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={onToggle}
            >
                {/* Mini radar snapshot */}
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <MiniRadar data={radarData} />
                </div>

                {/* Date + tier badge */}
                <div className="flex-1 min-w-0">
                    <p style={{ fontSize: "0.875rem", color: "#e8e8e8", fontWeight: 500 }}>
                        {formattedDate}
                    </p>
                    <span
                        className="inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[0.58rem] font-semibold tracking-widest"
                        style={{ background: badge.bg, color: badge.color }}
                    >
                        {record.skin_tier}
                    </span>
                </div>

                {/* Compare checkbox + expand caret */}
                <div
                    className="flex items-center gap-3 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleCompare}
                            disabled={compareDisabled}
                            className="sr-only"
                        />
                        {/* Custom checkbox */}
                        <span
                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={{
                                border: `1.5px solid ${isSelected ? GOLD : "rgba(148,126,92,0.35)"}`,
                                background: isSelected ? "rgba(45,107,74,0.12)" : "transparent",
                                opacity: compareDisabled && !isSelected ? 0.3 : 1,
                            }}
                        >
                            {isSelected && (
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path
                                        d="M1.5 4l2 2 3-3"
                                        stroke={GOLD}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </span>
                        <span style={{ fontSize: "0.58rem", color: BRONZE, letterSpacing: "0.05em" }}>
                            {de ? "Vergl." : "Compare"}
                        </span>
                    </label>

                    <span style={{ color: BRONZE }}>
                        {isExpanded
                            ? <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                            : <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                        }
                    </span>
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className="px-5 pb-5 pt-3 space-y-5"
                            style={{ borderTop: "1px solid rgba(45,107,74,0.08)" }}
                        >
                            {/* Full radar chart */}
                            <FullRadar data={radarData} />

                            {/* Axis score bars */}
                            <div>
                                <SectionHead>{de ? "Dimensions-Scores" : "Axis Scores"}</SectionHead>
                                <div className="space-y-2">
                                    {RADAR_AXES.map((key) => {
                                        const score = Math.round(record.radar_data[key] ?? 0);
                                        const color = AXIS_COLORS[key] ?? GOLD;
                                        return (
                                            <div key={key} className="flex items-center gap-2">
                                                <span style={{ fontSize: "0.7rem", color: BRONZE, width: "88px", flexShrink: 0 }}>
                                                    {axisLabels[key as AxisKey] ?? key}
                                                </span>
                                                <div
                                                    className="flex-1 rounded-full"
                                                    style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}
                                                >
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${score}%` }}
                                                        transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
                                                        className="h-full rounded-full"
                                                        style={{ background: color }}
                                                    />
                                                </div>
                                                <span style={{
                                                    fontSize: "0.7rem",
                                                    color: "#e8e8e8",
                                                    fontFamily: "monospace",
                                                    width: "26px",
                                                    textAlign: "right",
                                                }}>
                                                    {score}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recommended products */}
                            {record.recommended_products.length > 0 && (
                                <div>
                                    <SectionHead>
                                        {de ? "Empfohlene Produkte" : "Recommended Products"}
                                    </SectionHead>
                                    <div className="space-y-2">
                                        {record.recommended_products.map((p) => (
                                            <div
                                                key={p.id}
                                                className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
                                                style={{
                                                    background: "rgba(45,107,74,0.04)",
                                                    border: "1px solid rgba(45,107,74,0.09)",
                                                }}
                                            >
                                                <Link
                                                    to={`/formula/${p.id}`}
                                                    className="text-sm font-medium hover:opacity-75 transition-opacity"
                                                    style={{ color: "#e8e8e8" }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {p.name}
                                                </Link>
                                                <span
                                                    className="rounded px-2 py-0.5 text-[0.55rem] font-semibold ml-3 flex-shrink-0"
                                                    style={{
                                                        background: "rgba(45,107,74,0.09)",
                                                        color: GOLD,
                                                        letterSpacing: "0.1em",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {p.phase}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DiagnosisHistoryPage({ de }: { de: boolean }) {
    const { history, loading } = useDiagnosis();
    const axisLabels = de ? AXIS_LABELS_DE : AXIS_LABELS;

    // UI state
    const [hiddenAxes, setHiddenAxes] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [compareIds, setCompareIds] = useState<string[]>([]);

    const toggleAxis = (key: string) => {
        setHiddenAxes((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleCompare = (id: string) => {
        setCompareIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 2) return prev; // max 2 selections
            return [...prev, id];
        });
    };

    // Chronological data for line chart (oldest → newest left-to-right)
    const lineData = useMemo(
        () =>
            [...history].reverse().map((rec) => ({
                date: new Date(rec.diagnosed_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                }),
                ...RADAR_AXES.reduce<Record<string, number>>((acc, key) => {
                    acc[key] = Math.round(rec.radar_data[key] ?? 0);
                    return acc;
                }, {}),
            })),
        [history]
    );

    // 90-day re-analyse CTA
    const daysSinceLatest = useMemo(() => {
        if (!history[0]) return Infinity;
        return (Date.now() - new Date(history[0].diagnosed_at).getTime()) / 86_400_000;
    }, [history]);
    const showReanalyze = daysSinceLatest > 90;

    // Comparison records — sorted so newer.diagnosed_at > older.diagnosed_at
    const compareRecords = useMemo(() => {
        if (compareIds.length !== 2) return null;
        const a = history.find((r) => r.id === compareIds[0]);
        const b = history.find((r) => r.id === compareIds[1]);
        if (!a || !b) return null;
        const newer = new Date(a.diagnosed_at) >= new Date(b.diagnosed_at) ? a : b;
        const older = newer === a ? b : a;
        return { newer, older };
    }, [compareIds, history]);

    const comparisonRadarData = useMemo(() => {
        if (!compareRecords) return [];
        return RADAR_AXES.map((key) => ({
            axis: axisLabels[key as AxisKey] ?? key,
            newer: Math.round(compareRecords.newer.radar_data[key] ?? 0),
            older: Math.round(compareRecords.older.radar_data[key] ?? 0),
            fullMark: 100,
        }));
    }, [compareRecords, axisLabels]);

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-3">
                <div
                    className="h-[220px] rounded-2xl animate-pulse"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(45,107,74,0.07)" }}
                />
                {[1, 2].map((i) => (
                    <div
                        key={i}
                        className="h-24 rounded-2xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(45,107,74,0.07)" }}
                    />
                ))}
            </div>
        );
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (history.length === 0) return <EmptyState de={de} />;

    return (
        <div className="space-y-6">

            {/* ── 1. Progression Line Chart ────────────────────────────── */}
            <section>
                <div className="flex items-start justify-between mb-3">
                    <SectionHead>{de ? "Hautprogress" : "Skin Progress"}</SectionHead>
                    {showReanalyze && (
                        <Link
                            to="/diagnosis"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
                            style={{
                                background: GOLD,
                                color: "#F5F5F7",
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                            }}
                        >
                            <FlaskConical className="w-3 h-3" strokeWidth={1.5} />
                            {de ? "Neu analysieren" : "Re-Analyze"}
                        </Link>
                    )}
                </div>

                <div
                    className="rounded-2xl p-4 pb-3"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,107,74,0.1)" }}
                >
                    {history.length < 2 ? (
                        <div className="py-10 text-center">
                            <p style={{ fontSize: "0.8125rem", color: BRONZE, lineHeight: 1.6 }}>
                                {de
                                    ? "Führen Sie eine weitere Analyse durch, um Ihren Fortschritt zu sehen."
                                    : "Complete one more diagnosis to see your progress over time."}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart
                                data={lineData}
                                margin={{ top: 8, right: 8, bottom: 0, left: -28 }}
                            >
                                <CartesianGrid
                                    stroke="rgba(255,255,255,0.04)"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: BRONZE, fontSize: 9, fontFamily: "inherit" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fill: "rgba(148,126,92,0.45)", fontSize: 8 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<LineTooltip />} />
                                {RADAR_AXES.map((key) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        name={axisLabels[key as AxisKey]}
                                        stroke={AXIS_COLORS[key]}
                                        strokeWidth={1.5}
                                        dot={{ r: 3, strokeWidth: 0, fill: AXIS_COLORS[key] }}
                                        activeDot={{ r: 4.5, strokeWidth: 0 }}
                                        hide={hiddenAxes.has(key)}
                                        isAnimationActive={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}

                    {/* Toggleable axis legend pills */}
                    <div
                        className="flex flex-wrap gap-1.5 mt-3 pt-3"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                    >
                        {RADAR_AXES.map((key) => {
                            const hidden = hiddenAxes.has(key);
                            const color = AXIS_COLORS[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => toggleAxis(key)}
                                    className="transition-all duration-150"
                                    style={{
                                        padding: "0.18rem 0.55rem",
                                        borderRadius: "99px",
                                        fontSize: "0.57rem",
                                        letterSpacing: "0.05em",
                                        background: hidden ? "transparent" : `${color}1A`,
                                        border: `1px solid ${hidden ? "rgba(255,255,255,0.08)" : color}`,
                                        color: hidden ? "rgba(148,126,92,0.4)" : color,
                                    }}
                                >
                                    {axisLabels[key as AxisKey]}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── 2. Comparison overlay ────────────────────────────────── */}
            <AnimatePresence>
                {compareRecords && (
                    <motion.section
                        key="comparison-overlay"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div
                            className="rounded-2xl p-5"
                            style={{
                                background: "rgba(8,8,8,0.9)",
                                backdropFilter: "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                                border: `1px solid rgba(45,107,74,0.22)`,
                                boxShadow: `0 0 48px rgba(45,107,74,0.06)`,
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-1">
                                <div>
                                    <SectionHead>{de ? "Vergleichsansicht" : "Comparison View"}</SectionHead>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" style={{ marginTop: "-0.1rem", marginBottom: "0.75rem" }}>
                                        <span style={{ fontSize: "0.65rem", color: GOLD }}>
                                            ▬ {de ? "Neueste" : "Newest"}:{" "}
                                            {new Date(compareRecords.newer.diagnosed_at).toLocaleDateString(
                                                de ? "de-DE" : "en-GB",
                                                { day: "2-digit", month: "short", year: "2-digit" }
                                            )}
                                        </span>
                                        <span style={{ fontSize: "0.65rem", color: BRONZE }}>
                                            ╌ {de ? "Ältere" : "Older"}:{" "}
                                            {new Date(compareRecords.older.diagnosed_at).toLocaleDateString(
                                                de ? "de-DE" : "en-GB",
                                                { day: "2-digit", month: "short", year: "2-digit" }
                                            )}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCompareIds([])}
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0 mt-0.5"
                                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                                >
                                    <X className="w-3.5 h-3.5" style={{ color: BRONZE }} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Overlaid radar */}
                            <ComparisonRadar
                                data={comparisonRadarData}
                                newerLabel={de ? "Neueste" : "Newest"}
                                olderLabel={de ? "Ältere" : "Older"}
                            />

                            {/* Delta scores grid */}
                            <div
                                className="mt-4 pt-4 space-y-2"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                            >
                                <SectionHead>{de ? "Veränderungen" : "Changes"}</SectionHead>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                    {RADAR_AXES.map((key) => {
                                        const newer = compareRecords.newer.radar_data[key] ?? 0;
                                        const older = compareRecords.older.radar_data[key] ?? 0;
                                        const delta = Math.round(newer - older);
                                        const deltaColor =
                                            delta > 0 ? "#EF4444" : delta < 0 ? "#4ADE80" : "rgba(255,255,255,0.2)";
                                        return (
                                            <div key={key} className="flex items-center justify-between">
                                                <span style={{ fontSize: "0.68rem", color: BRONZE }}>
                                                    {axisLabels[key as AxisKey]}
                                                </span>
                                                <span style={{
                                                    fontSize: "0.72rem",
                                                    fontFamily: "monospace",
                                                    fontWeight: 600,
                                                    color: deltaColor,
                                                }}>
                                                    {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* ── 3. Diagnosis Archive ─────────────────────────────────── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <SectionHead>{de ? "Analyse-Archiv" : "Analysis Archive"}</SectionHead>
                    {compareIds.length === 1 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ fontSize: "0.63rem", color: BRONZE }}
                        >
                            {de ? "Wählen Sie 1 weiteres zum Vergleich" : "Select 1 more to compare"}
                        </motion.p>
                    )}
                </div>

                <div className="space-y-3">
                    {history.map((record) => (
                        <DiagnosisCard
                            key={record.id}
                            record={record}
                            de={de}
                            isExpanded={expandedId === record.id}
                            onToggle={() =>
                                setExpandedId((prev) => (prev === record.id ? null : record.id))
                            }
                            isSelected={compareIds.includes(record.id)}
                            onToggleCompare={() => toggleCompare(record.id)}
                            compareDisabled={compareIds.length >= 2 && !compareIds.includes(record.id)}
                            axisLabels={axisLabels}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
