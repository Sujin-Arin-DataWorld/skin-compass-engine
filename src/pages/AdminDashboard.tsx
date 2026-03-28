/**
 * AdminDashboard — Phase 2 MLOps Training Data Dashboard
 *
 * Provides:
 *   1. Training pipeline health metrics (from get_training_stats RPC)
 *   2. JSONL dataset export for Llama Vision fine-tuning
 *   3. Readiness progress bar (% toward 1,000 sample goal)
 *
 * Dark/Light mode via --ssl-* design tokens.
 * Protected route — must be accessible only to authenticated admins.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Download,
  RefreshCw,
  TrendingUp,
  Database,
  Image,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Shield,
  Target,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { getTrainingStats, fetchTrainingExport } from '@/services/skinAnalysisService';

const TRAINING_GOAL = 1000; // Target: 1,000 training-ready samples

interface TrainingStats {
  total_analyses: number;
  with_feedback: number;
  accurate_count: number;
  inaccurate_count: number;
  with_images: number;
  training_ready: number;
  with_reasons: number;
  with_lifestyle: number;
  active_ai_consents: number;
  avg_latency_ms: number;
  latest_analysis_at: string | null;
  readiness_pct: number;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  accentColor?: string;
}) {
  const color = accentColor ?? 'var(--ssl-accent)';
  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300"
      style={{
        background: 'var(--ssl-bg-card)',
        border: '1px solid var(--ssl-border)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--ssl-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </p>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-numeric)',
          fontSize: '28px',
          fontWeight: 700,
          color: 'var(--ssl-text)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--ssl-text-tertiary)',
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrainingStats();
      if (data) {
        setStats(data as unknown as TrainingStats);
      } else {
        setError('Failed to load statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── JSONL Export Handler ─────────────────────────────────────────────────
  const handleExportJSONL = useCallback(async () => {
    setExporting(true);
    try {
      const rows = await fetchTrainingExport();

      if (rows.length === 0) {
        alert('No training-ready records found. Need: accurate feedback + stored image.');
        return;
      }

      // Convert to JSONL format (one JSON object per line)
      // Format compatible with HuggingFace / OpenAI fine-tuning
      const jsonlLines = rows.map((row) => {
        return JSON.stringify({
          // SFT format: input context + target output
          image_storage_path: row.storage_path,
          input: {
            lifestyle: row.lifestyle_json ?? null,
          },
          output: {
            scores: row.scores_json,
            reasons: row.reasons_json ?? null,
          },
          metadata: {
            analysis_id: row.analysis_id,
            model_version: row.model_version,
            inference_latency_ms: row.inference_latency_ms,
            user_feedback: row.user_feedback,
            feedback_tags: row.feedback_tags ?? null,
            feedback_comment: row.feedback_comment ?? null,
            created_at: row.created_at,
          },
        });
      });

      const blob = new Blob([jsonlLines.join('\n')], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssl-training-data-${new Date().toISOString().slice(0, 10)}.jsonl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[AdminDashboard] Export error:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  }, []);

  // ── Progress toward training goal ───────────────────────────────────────
  const progressPct = stats ? Math.min((stats.training_ready / TRAINING_GOAL) * 100, 100) : 0;
  const progressColor =
    progressPct >= 80 ? 'var(--ssl-accent)' :
    progressPct >= 40 ? '#D2AC47' :
    '#E8796A';

  return (
    <div
      className="min-h-screen p-4 sm:p-8"
      style={{ background: 'var(--ssl-bg)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={16} style={{ color: 'var(--ssl-accent)' }} />
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--ssl-accent)',
                }}
              >
                Phase 2 • MLOps Dashboard
              </p>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--ssl-text)',
              }}
            >
              Training Data Pipeline
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all active:scale-95"
              style={{
                background: 'var(--ssl-bg-surface)',
                border: '1px solid var(--ssl-border)',
                color: 'var(--ssl-text-secondary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExportJSONL}
              disabled={exporting || !stats?.training_ready}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all active:scale-95"
              style={{
                background: stats?.training_ready ? 'var(--ssl-accent)' : 'var(--ssl-bg-surface)',
                color: stats?.training_ready ? '#FFFFFF' : 'var(--ssl-text-tertiary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 600,
                border: stats?.training_ready ? 'none' : '1px solid var(--ssl-border)',
                opacity: exporting ? 0.6 : 1,
              }}
            >
              {exporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export .jsonl
            </button>
          </div>
        </div>

        {/* ── Error State ─────────────────────────────────────────── */}
        {error && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{
              background: 'color-mix(in srgb, #E8796A 8%, var(--ssl-bg-card))',
              border: '1px solid color-mix(in srgb, #E8796A 25%, transparent)',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#E8796A' }} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#E8796A' }}>
              {error}
            </p>
          </div>
        )}

        {/* ── Loading Skeleton ────────────────────────────────────── */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-24">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: 'var(--ssl-accent)' }}
            />
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────────────────── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Progress Bar */}
            <div
              className="rounded-2xl p-5 mb-6"
              style={{
                background: 'var(--ssl-bg-card)',
                border: '1px solid var(--ssl-border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={14} style={{ color: progressColor }} />
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--ssl-text)',
                    }}
                  >
                    Fine-Tuning Readiness
                  </p>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-numeric)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: progressColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stats.training_ready} / {TRAINING_GOAL}
                </p>
              </div>
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: 'var(--ssl-bg-surface)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ background: progressColor }}
                />
              </div>
              <p
                className="mt-2 text-right"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: 'var(--ssl-text-tertiary)',
                }}
              >
                {progressPct >= 100
                  ? '🎉 Ready for LoRA SFT!'
                  : `${Math.round(progressPct)}% — ${TRAINING_GOAL - stats.training_ready} more needed`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon={Database}
                label="Total Analyses"
                value={stats.total_analyses.toLocaleString()}
                sublabel="All-time"
              />
              <StatCard
                icon={ThumbsUp}
                label="Accurate"
                value={stats.accurate_count.toLocaleString()}
                sublabel={`${stats.with_feedback} total feedback`}
                accentColor="var(--ssl-accent)"
              />
              <StatCard
                icon={ThumbsDown}
                label="Inaccurate"
                value={stats.inaccurate_count.toLocaleString()}
                sublabel="Correction signals"
                accentColor="#E8796A"
              />
              <StatCard
                icon={Image}
                label="Stored Images"
                value={stats.with_images.toLocaleString()}
                sublabel="With consent"
                accentColor="var(--ssl-secondary)"
              />
              <StatCard
                icon={TrendingUp}
                label="Training Ready"
                value={stats.training_ready.toLocaleString()}
                sublabel="Accurate + Image"
                accentColor={progressColor}
              />
              <StatCard
                icon={Brain}
                label="With Reasons"
                value={stats.with_reasons.toLocaleString()}
                sublabel="AI explanations"
              />
              <StatCard
                icon={Shield}
                label="AI Consents"
                value={stats.active_ai_consents.toLocaleString()}
                sublabel="Active opt-ins"
              />
              <StatCard
                icon={Clock}
                label="Avg Latency"
                value={`${Math.round(stats.avg_latency_ms)}ms`}
                sublabel="Groq inference"
                accentColor="#D2AC47"
              />
            </div>

            {/* Data Quality Summary */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'var(--ssl-bg-card)',
                border: '1px solid var(--ssl-border)',
              }}
            >
              <p
                className="mb-3"
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ssl-text)',
                }}
              >
                Dataset Quality Signals
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: 'Feedback coverage',
                    value: stats.total_analyses > 0
                      ? `${Math.round((stats.with_feedback / stats.total_analyses) * 100)}%`
                      : '—',
                  },
                  {
                    label: 'Accuracy rate',
                    value: stats.with_feedback > 0
                      ? `${Math.round((stats.accurate_count / stats.with_feedback) * 100)}%`
                      : '—',
                  },
                  {
                    label: 'Image consent rate',
                    value: stats.accurate_count > 0
                      ? `${Math.round(stats.readiness_pct)}%`
                      : '—',
                  },
                  {
                    label: 'Reasons coverage',
                    value: stats.total_analyses > 0
                      ? `${Math.round((stats.with_reasons / stats.total_analyses) * 100)}%`
                      : '—',
                  },
                  {
                    label: 'Lifestyle context coverage',
                    value: stats.total_analyses > 0
                      ? `${Math.round((stats.with_lifestyle / stats.total_analyses) * 100)}%`
                      : '—',
                  },
                  {
                    label: 'Latest analysis',
                    value: stats.latest_analysis_at
                      ? new Date(stats.latest_analysis_at).toLocaleString()
                      : 'None',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1.5" style={{ borderBottom: '1px solid var(--ssl-border)' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ssl-text-secondary)' }}>
                      {row.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-numeric)', fontSize: '12px', fontWeight: 600, color: 'var(--ssl-text)', fontVariantNumeric: 'tabular-nums' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
