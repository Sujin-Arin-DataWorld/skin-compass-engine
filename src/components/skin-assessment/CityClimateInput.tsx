/**
 * CityClimateInput
 *
 * Step 1: Autocomplete search → Open-Meteo Geocoding API (debounced 300ms)
 * Step 2: User selects city → fetch 90-day archive + 7-day forecast
 * Step 3: computeClimateSkInScore() → ClimateProfile
 * Step 4: Render summary card with city, temp range, and 3 skin risk badges
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Search, X, Wind, Droplets, Sun } from "lucide-react";
import type { Lang } from "@/engine/questionRoutingV5";
import type { ClimateProfile, GeoSuggestion } from "@/engine/climateEngine";
import {
  fetchCitySuggestions,
  fetchClimateData,
  computeClimateSkInScore,
} from "@/engine/climateEngine";
import { useAnalysisStore } from "@/store/analysisStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type LT = Record<Lang, string>;

function tx(obj: LT, lang: Lang): string {
  return obj[lang] ?? obj.en;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const C = {
  placeholder: { en: "City or postal code...", de: "Stadt oder PLZ...", ko: "도시명 또는 우편번호..." } as LT,
  loading: { en: "Analysing climate data...", de: "Klimadaten werden analysiert...", ko: "기후 데이터 분석 중..." } as LT,
  noResults: { en: "No cities found", de: "Keine Städte gefunden", ko: "도시를 찾을 수 없습니다" } as LT,
  noResultsHint: {
    en: "Tip: Try a nearby major city or postal code.",
    de: "Tipp: PLZ oder den Stadtnamen auf Englisch versuchen (z. B. Munich)",
    ko: "도움말: 우편번호 또는 영어로 검색해 보세요 (예: 06779, Seoul)",
  } as LT,
  dryness: { en: "Dryness", de: "Trockenheit", ko: "건조함" } as LT,
  humidity: { en: "Humidity", de: "Feuchtigkeit", ko: "습도" } as LT,
  uv: { en: "UV", de: "UV", ko: "자외선" } as LT,
  changeCity: { en: "Change", de: "Ändern", ko: "변경" } as LT,
  error: { en: "Failed to load climate data. Please try again.", de: "Klimadaten konnten nicht geladen werden.", ko: "기후 데이터를 불러오지 못했습니다." } as LT,
  searchTip: {
    en: "💡 Search by city name or postal code (e.g. 10967, Seoul, Munich)",
    de: "💡 Suche nach Stadtname oder PLZ (z. B. 10967, München, Seoul)",
    ko: "💡 도시명 또는 우편번호로 검색하세요 (예: 06779, 수원시, Frankfurt)",
  } as LT,
  now: { en: "Now", de: "Jetzt", ko: "현재" } as LT,
  today: { en: "Today", de: "Heute", ko: "오늘" } as LT,
  avg90: { en: "90-day avg", de: "90-Tage Ø", ko: "90일 평균" } as LT,
} as const;

// ─── Risk badge colours ───────────────────────────────────────────────────────

const RISK = {
  low: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  moderate: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  high: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface CityClimateInputProps {
  lang: Lang;
  /** Called with the legacy climateType string for backward compat */
  onLegacyChange: (climateType: string) => void;
}

export function CityClimateInput({ lang, onLegacyChange }: CityClimateInputProps) {
  const setClimateProfile = useAnalysisStore((s) => s.setClimateProfile);
  const storedProfile = useAnalysisStore((s) => s.lifestyle.climateProfile);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // true only after a search request has fully completed for the current query
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // lang is a dep because fetchCitySuggestions receives it
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      setHasSearched(false);
      return;
    }
    console.log("[CityClimateInput] search() firing for:", q);
    setSearching(true);
    const results = await fetchCitySuggestions(q, lang);
    console.log("[CityClimateInput] results received:", results.length, results);
    setSuggestions(results);
    setOpen(results.length > 0);
    setSearching(false);
    setHasSearched(true);
  }, [lang]);

  useEffect(() => {
    setHasSearched(false);
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  async function selectCity(city: GeoSuggestion) {
    setOpen(false);
    setQuery("");
    setLoading(true);
    setError(null);
    try {
      const { archive, forecast, current } = await fetchClimateData(city.latitude, city.longitude);
      const profile = computeClimateSkInScore(
        archive, forecast,
        city.name, city.country,
        city.latitude, city.longitude,
        current
      );
      setClimateProfile(profile);
      onLegacyChange(profile.climateType);
    } catch {
      setError(tx(C.error, lang));
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    useAnalysisStore.getState().actions.updateLifestyle({ climateProfile: undefined, climate: undefined });
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-card/40 px-3 py-3 sm:px-4"
      >
        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-emerald-600 dark:text-amber-500 flex-shrink-0" />
        <span className="text-xs sm:text-sm text-muted-foreground">{tx(C.loading, lang)}</span>
      </motion.div>
    );
  }

  // ── Selected state: summary card ───────────────────────────────────────────
  if (storedProfile) {
    const badges = [
      { key: "dryness", label: tx(C.dryness, lang), risk: storedProfile.drynessRisk, Icon: Wind },
      { key: "humidity", label: tx(C.humidity, lang), risk: storedProfile.humidityRisk, Icon: Droplets },
      { key: "uv", label: tx(C.uv, lang), risk: storedProfile.uvRisk, Icon: Sun },
    ] as const;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-emerald-600/25 bg-emerald-50/30 dark:border-amber-500/30 dark:bg-amber-950/10 p-3 sm:p-4 space-y-2.5 sm:space-y-3"
      >
        {/* City row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
            <MapPin
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-amber-400 flex-shrink-0 mt-0.5"
              strokeWidth={1.7}
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-emerald-800 dark:text-amber-300 break-words leading-snug">
                {storedProfile.city}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                {storedProfile.country}
              </p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="flex-shrink-0 text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 whitespace-nowrap"
          >
            {tx(C.changeCity, lang)}
          </button>
        </div>

        {/* Temperature display: Current + Today + 90-day avg */}
        <div className="flex items-end gap-3 sm:gap-4">
          {/* Current temp — big and prominent */}
          {storedProfile.currentTemp != null && (
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">
                {tx(C.now, lang)}
              </span>
              <span className="text-xl sm:text-2xl font-semibold text-foreground leading-none mt-0.5">
                {Math.round(storedProfile.currentTemp)}°
              </span>
            </div>
          )}

          {/* Divider */}
          {storedProfile.currentTemp != null && (
            <div className="h-8 w-px bg-border/60 flex-shrink-0" />
          )}

          {/* Today's forecast */}
          {storedProfile.todayMaxTemp != null && storedProfile.todayMinTemp != null && (
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                {tx(C.today, lang)}
              </span>
              <span className="text-xs sm:text-sm font-medium text-foreground/80 leading-snug">
                {Math.round(storedProfile.todayMaxTemp)}° / {Math.round(storedProfile.todayMinTemp)}°
              </span>
            </div>
          )}

          {/* Divider */}
          {storedProfile.todayMaxTemp != null && (
            <div className="h-8 w-px bg-border/60 flex-shrink-0" />
          )}

          {/* 90-day average */}
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
              {tx(C.avg90, lang)}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground leading-snug">
              {storedProfile.avgMaxTemp}° / {storedProfile.avgMinTemp}°
            </span>
          </div>
        </div>

        {/* Risk badges */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {badges.map(({ key, label, risk, Icon }) => {
            const c = RISK[risk];
            return (
              <div key={key} className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 ${c.bg}`}>
                <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${c.text} flex-shrink-0`} strokeWidth={1.8} />
                <span className={`text-[9px] sm:text-[10px] font-medium ${c.text}`}>{label}</span>
                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                <span className={`text-[9px] sm:text-[10px] ${c.text} capitalize`}>{risk}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── Search input + dropdown ────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Input field */}
      <div className="relative flex items-center rounded-xl border border-border/60 bg-background/80 focus-within:border-emerald-500 dark:focus-within:border-amber-400 transition-colors">
        {searching ? (
          <Loader2
            className="absolute left-3 w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-muted-foreground pointer-events-none"
          />
        ) : (
          <Search
            className="absolute left-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none"
            strokeWidth={1.7}
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={tx(C.placeholder, lang)}
          className="w-full bg-transparent pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 text-xs sm:text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); }}
            className="absolute right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.7} />
          </button>
        )}
      </div>

      {/* Search tip — shown while the user is actively typing */}
      <AnimatePresence>
        {query.trim().length >= 2 && !open && !hasSearched && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground/60 leading-relaxed"
          >
            {tx(C.searchTip, lang)}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full min-w-[200px] rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden"
          >
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => selectCity(s)}
                  className="flex w-full items-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-accent transition-colors"
                >
                  <MapPin
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground flex-shrink-0 mt-[3px]"
                    strokeWidth={1.7}
                  />
                  {/* Name + region stacked, country code pinned right */}
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs sm:text-sm font-medium break-words leading-snug">
                      {s.name}
                    </span>
                    {(s.admin1 || s.country) && (
                      <span className="block text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        {[s.admin1, s.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[10px] sm:text-xs text-muted-foreground mt-[2px]">
                    {s.country_code}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* No results — only shown after a search actually completed */}
      {hasSearched && !searching && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="mt-2 space-y-1 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">{tx(C.noResults, lang)}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground/60 italic">
            {tx(C.noResultsHint, lang)}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-[11px] sm:text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
}
