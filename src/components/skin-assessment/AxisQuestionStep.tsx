import { motion, AnimatePresence } from "framer-motion";
import type {
  AxisDef,
  QuestionDef,
  QuestionAnswer,
  Lang,
} from "@/engine/questionRoutingV5";
import { SingleSelectCard } from "./questions/SingleSelectCard";
import { MultiSelectChips } from "./questions/MultiSelectChips";
import { ImageButtonSelector } from "./questions/ImageButtonSelector";
import { MagneticSlider } from "./questions/MagneticSlider";

export type AnswerMap = Record<string, QuestionAnswer>;

function getText(
  t: { en: string; de: string; ko: string },
  lang: Lang
): string {
  return t[lang] ?? t.en;
}

interface AxisQuestionStepProps {
  axis: AxisDef;
  lang: Lang;
  answers: AnswerMap;
  onChange: (id: string, value: QuestionAnswer) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Renders all questions for a single professional axis.
 * Handles conditional injection and hideIf logic.
 */
export function AxisQuestionStep({
  axis,
  lang,
  answers,
  onChange,
  onNext,
  onBack,
}: AxisQuestionStepProps) {
  // Build the ordered list of questions to show, including injected conditionals
  const visibleQuestions: QuestionDef[] = [];

  for (const q of axis.questions) {
    // Check hideIf
    if (q.hideIf) {
      const depAnswer = answers[q.hideIf.questionId];
      if (
        typeof depAnswer === "string" &&
        q.hideIf.values.includes(depAnswer)
      ) {
        continue; // skip this question
      }
    }

    visibleQuestions.push(q);

    // Check if this question has a conditional that should inject a follow-up
    if (q.conditional) {
      const { ifQuestionId, ifValues, inject } = q.conditional;
      const triggerAnswer = answers[ifQuestionId];
      const triggered =
        typeof triggerAnswer === "string" &&
        ifValues.includes(triggerAnswer);
      if (triggered) {
        visibleQuestions.push(inject);
      }
    }
  }

  // Determine if all required visible questions are answered
  const canContinue = visibleQuestions
    .filter((q) => q.required)
    .every((q) => {
      const a = answers[q.id];
      if (q.type === "multi") return Array.isArray(a) && a.length > 0;
      if (q.type === "slider") return typeof a === "number";
      return typeof a === "string" && a.length > 0;
    });

  return (
    <div className="w-full">
      {/* Axis header */}
      <div className="mb-7">
        <p
          className="mb-2 text-[0.62rem] tracking-[0.2em] uppercase font-medium"
          style={{ color: "#C9A96E" }}
        >
          {getText(axis.eyebrow, lang)}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-light text-foreground leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {getText(axis.name, lang)}
        </h2>
        <div className="mt-3 h-px w-10 rounded-full" style={{ background: "linear-gradient(to right, #C9A96E, transparent)" }} />
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {visibleQuestions.map((q, idx) => (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 28, delay: idx * 0.05 }}
              className="relative rounded-2xl border border-border/40 bg-card/60 p-5 shadow-sm overflow-hidden"
              style={{ backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}
            >
              {/* Gold accent strip */}
              <div
                className="absolute left-0 top-5 bottom-5 w-[2px] rounded-full"
                style={{ background: "linear-gradient(to bottom, #C9A96E, transparent)" }}
              />
              {/* Question text */}
              <p className="mb-3.5 text-sm sm:text-base font-light text-foreground leading-relaxed">
                {getText(q.text, lang)}
                {q.required && (
                  <span className="ml-1 text-amber-500">*</span>
                )}
              </p>
              {q.hint && (
                <p className="mb-3 text-xs text-muted-foreground font-light italic">
                  {getText(q.hint, lang)}
                </p>
              )}

              {/* Input component based on type */}
              {(q.type === "single") && q.options && (
                <SingleSelectCard
                  options={q.options}
                  value={(answers[q.id] as string) ?? null}
                  lang={lang}
                  onChange={(id) => onChange(q.id, id)}
                />
              )}

              {q.type === "multi" && q.options && (
                <MultiSelectChips
                  options={q.options}
                  value={(answers[q.id] as string[]) ?? []}
                  lang={lang}
                  onChange={(ids) => onChange(q.id, ids)}
                />
              )}

              {q.type === "image" && q.options && (
                <ImageButtonSelector
                  options={q.options}
                  value={(answers[q.id] as string) ?? null}
                  lang={lang}
                  onChange={(id) => onChange(q.id, id)}
                />
              )}

              {q.type === "slider" && q.slider && (
                <MagneticSlider
                  config={q.slider}
                  value={
                    typeof answers[q.id] === "number"
                      ? (answers[q.id] as number)
                      : q.slider.defaultValue
                  }
                  lang={lang}
                  onChange={(v) => onChange(q.id, v)}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <motion.div
        className="mt-10 flex items-center justify-between pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground min-h-[44px] touch-manipulation"
        >
          ← Back
        </button>
        <motion.button
          onClick={onNext}
          disabled={!canContinue}
          whileTap={canContinue ? { scale: 0.96 } : undefined}
          className="rounded-xl px-7 py-3 text-sm font-medium text-white transition-all min-h-[44px] touch-manipulation disabled:opacity-30"
          style={{
            background: canContinue
              ? "linear-gradient(135deg, hsl(35 65% 50%), hsl(30 70% 45%))"
              : undefined,
            backgroundColor: canContinue ? undefined : "hsl(var(--muted))",
            color: canContinue ? "white" : undefined,
          }}
        >
          Continue →
        </motion.button>
      </motion.div>
    </div>
  );
}
