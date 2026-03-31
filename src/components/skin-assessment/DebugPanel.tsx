import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";
import type { AnalysisResult } from "@/engine/types";
import { AXIS_KEYS, AXIS_LABELS } from "@/engine/types";
type DebugData = NonNullable<AnalysisResult["_debug"]>;

interface DebugPanelProps {
  debugData: DebugData;
}

const DebugPanel = ({ debugData }: DebugPanelProps) => {
  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"scores" | "patterns" | "dedup" | "symptoms">("scores");

  const tabs = [
    { key: "scores" as const, label: "Axis Scores" },
    { key: "patterns" as const, label: "Patterns" },
    { key: "dedup" as const, label: "De-dup" },
    { key: "symptoms" as const, label: "Top Symptoms" },
  ];

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t-2 border-primary/50 bg-background/95 backdrop-blur-md shadow-2xl"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-mono text-primary hover:bg-primary/5"
      >
        <span className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5" />
          DEBUG / CALIBRATION MODE
        </span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-auto max-h-[50vh] px-4 pb-4"
          >
            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-border pb-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${activeTab === t.key
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scores tab */}
            {activeTab === "scores" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {AXIS_KEYS.map((k) => (
                  <div key={k} className="rounded border border-border p-2 font-mono text-[10px]">
                    <p className="text-muted-foreground">{AXIS_LABELS[k]}</p>
                    <div className="mt-1 space-y-0.5">
                      <Row label="Raw" value={debugData.rawScores[k]?.toFixed(2)} />
                      <Row label="Norm" value={debugData.normalizedScores[k]?.toFixed(1)} />
                      <Row label="Final" value={debugData.finalScores[k]?.toFixed(1)} />
                      <Row
                        label="Sev"
                        value={["Clear", "Low", "Mod", "High"][debugData.axisSeverities[k]] ?? "?"}
                        color={
                          debugData.axisSeverities[k] === 0
                            ? "text-severity-clear"
                            : debugData.axisSeverities[k] === 1
                              ? "text-severity-mild"
                              : debugData.axisSeverities[k] === 2
                                ? "text-severity-moderate"
                                : "text-severity-severe"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Patterns tab */}
            {activeTab === "patterns" && (
              <div className="space-y-2">
                {debugData.patterns.length === 0 && (
                  <p className="text-xs text-muted-foreground font-mono">No patterns activated</p>
                )}
                {debugData.patterns.map((p) => (
                  <div key={p.id} className="rounded border border-border p-2 font-mono text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-foreground font-medium">{p.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${p.confidence >= 80 ? "bg-severity-severe/20 text-severity-severe"
                          : p.confidence >= 60 ? "bg-severity-moderate/20 text-severity-moderate"
                            : "bg-severity-mild/20 text-severity-mild"
                        }`}>
                        {p.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">Flag: {p.flag} | Sev: {p.severity}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Dedup tab */}
            {activeTab === "dedup" && (
              <div className="space-y-1">
                {Object.keys(debugData.dedupScales).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">No de-dup applied (no interactive modules used)</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                    {Object.entries(debugData.dedupScales).map(([sid, scale]) => (
                      <div
                        key={sid}
                        className={`rounded border p-1.5 font-mono text-[9px] ${(scale as number) < 1 ? "border-severity-moderate/40 bg-severity-moderate/5" : "border-border"
                          }`}
                      >
                        <span className="text-foreground">{sid}</span>
                        <span className="text-muted-foreground ml-1">×{String(scale)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top symptoms tab */}
            {activeTab === "symptoms" && (
              <div className="space-y-1">
                {debugData.topSymptoms.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-foreground w-12">{s.id}</span>
                    <span className={`w-4 text-center ${s.severity >= 3 ? "text-severity-severe" : s.severity >= 2 ? "text-severity-moderate" : "text-severity-mild"
                      }`}>
                      {s.severity}
                    </span>
                    <span className="text-muted-foreground truncate">{s.text}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Row = ({ label, value, color }: { label: string; value?: string; color?: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={color || "text-foreground"}>{value ?? "—"}</span>
  </div>
);

export default DebugPanel;
