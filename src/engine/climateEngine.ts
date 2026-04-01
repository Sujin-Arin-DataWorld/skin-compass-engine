/**
 * climateEngine.ts
 *
 * Fetches real-time climate data for a user-selected city (Open-Meteo APIs,
 * no API key required) and computes a ClimateProfile with 5 skin-relevant
 * risk dimensions.
 *
 * APIs used:
 *   Geocoding:  https://geocoding-api.open-meteo.com/v1/search
 *   Archive:    https://archive-api.open-meteo.com/v1/archive  (90-day history)
 *   Forecast:   https://api.open-meteo.com/v1/forecast         (7-day, UV data)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "moderate" | "high";

export interface ClimateProfile {
  city: string;
  country: string;
  lat: number;
  lon: number;

  /** 5 skin-relevant risk dimensions */
  drynessRisk: RiskLevel;
  humidityRisk: RiskLevel;
  uvRisk: RiskLevel;
  coldRisk: RiskLevel;
  heatRisk: RiskLevel;

  /**
   * Derived legacy identifier — backward compat with skinVectorEngine
   * and axisAnswerBridge string comparisons.
   */
  climateType: "climate_cold_dry" | "climate_humid" | "climate_hot_dry" | "climate_mild";

  /** Raw stats for UI display */
  avgMaxTemp: number; // °C, 90-day average
  avgMinTemp: number; // °C, 90-day average
  avgUV: number;      // UV index, 7-day average
  avgPrecip: number;  // mm/day, 90-day average

  /** Current / today's weather — for user-facing display */
  currentTemp: number | null;  // °C, real-time (from Forecast API `current`)
  todayMaxTemp: number | null; // °C, today's forecast max
  todayMinTemp: number | null; // °C, today's forecast min
}

export interface GeoSuggestion {
  id: number;
  name: string;
  country: string;
  country_code: string;
  admin1?: string; // state / region
  latitude: number;
  longitude: number;
}

interface DailyWeather {
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  uv_index_max?: number[];
}

interface CurrentWeather {
  temperature_2m: number;
  time: string;
}

// ─── Base URLs (proxy in dev, direct HTTPS in production) ────────────────────

const GEO_BASE      = import.meta.env.DEV ? "/api/geo"      : "https://geocoding-api.open-meteo.com";
const ARCHIVE_BASE  = import.meta.env.DEV ? "/api/archive"  : "https://archive-api.open-meteo.com";
const FORECAST_BASE = import.meta.env.DEV ? "/api/forecast" : "https://api.open-meteo.com";

// ─── Geocoding ────────────────────────────────────────────────────────────────

/**
 * Detects whether the input looks like a postal code (numeric or alphanumeric
 * patterns like "10967", "SW1A 1AA", "06-400").
 */
function looksLikePostalCode(query: string): boolean {
  const trimmed = query.trim();
  // Pure digits (e.g. "10967", "06400", "135-080")
  if (/^[\d\-\s]{3,10}$/.test(trimmed)) return true;
  // Alphanumeric with spaces/dashes (UK/CA style: "SW1A 1AA", "M5V 3L9")
  if (/^[A-Z0-9]{2,4}[\s\-]?[A-Z0-9]{2,4}$/i.test(trimmed)) return true;
  return false;
}

export async function fetchCitySuggestions(
  query: string,
  lang: string = "en"
): Promise<GeoSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const hasDigits = /\d/.test(trimmed);

  // 1) Handle postal code / mixed queries using Nominatim fallback
  // Open-Meteo Geocoding does NOT support postal-code based searches natively.
  if (hasDigits) {
    console.log(`[climateEngine] geocoding postal/mixed query using Nominatim →`, trimmed);
    try {
      // Free Nominatim API requires User-Agent header
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=5&accept-language=${lang}`;
      const nomRes = await fetch(nomUrl, {
        headers: { "User-Agent": "skin-compass-engine/1.0 (contact@skinstrategylab.de)" }
      });
      
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          const suggestions = nomData.map((item: any) => {
            let cityName = item.address?.city || item.address?.town || item.address?.village || item.name;
            return {
              id: item.place_id,
              name: cityName,
              country: item.address?.country || "",
              country_code: (item.address?.country_code || "").toUpperCase(),
              admin1: item.address?.state || "",
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            };
          }).filter((s) => s.name && !/^\d+$/.test(s.name)); // Filter out boundaries with numerical names

          // Deduplicate based on latitude/longitude (Nominatim sometimes returns duplicates for same region)
          const unique: GeoSuggestion[] = [];
          for (const s of suggestions) {
            if (!unique.some(u => Math.abs(u.latitude - s.latitude) < 0.05 && u.name === s.name)) {
              unique.push(s);
            }
          }
          
          if (unique.length > 0) {
            return unique;
          }
        }
      }
    } catch (err) {
      console.warn("[climateEngine] Nominatim fallback failed:", err);
    }
    
    // If Nominatim fails or returns empty, strip numbers completely and try Open-Meteo as a fallback
    // e.g. "60486, Frankfurt" -> "Frankfurt"
    const strOnly = trimmed.replace(/[\d\-\,]/g, "").trim();
    if (strOnly.length >= 2) {
      console.log(`[climateEngine] Stripped numbers, falling back to pure Open-Meteo query →`, strOnly);
      return fetchCitySuggestions(strOnly, lang); // Recursive call without digits
    }
  }

  // 2) Default Open-Meteo path for pure city names (fast, fuzzy matching, and population-sorted)
  const isPostal = looksLikePostalCode(trimmed);
  const count = isPostal ? 20 : 15;
  const url =
    `${GEO_BASE}/v1/search` +
    `?name=${encodeURIComponent(trimmed)}&count=${count}&language=${lang}&format=json`;

  console.log(`[climateEngine] geocoding URL (Open-Meteo) →`, url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("[climateEngine] non-ok response — returning []");
      return [];
    }

    const data = (await res.json()) as { results?: GeoSuggestion[] };
    return data.results ?? [];
  } catch (err) {
    console.error("[climateEngine] fetchCitySuggestions FAILED:", err);
    return [];
  }
}

// ─── Weather data fetch ───────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function fetchClimateData(
  lat: number,
  lon: number
): Promise<{ archive: DailyWeather; forecast: DailyWeather; current: CurrentWeather | null }> {
  const today = new Date();

  // Archive has a ~2-day processing lag
  const archiveEnd = new Date(today);
  archiveEnd.setDate(today.getDate() - 2);

  const archiveStart = new Date(archiveEnd);
  archiveStart.setDate(archiveEnd.getDate() - 89); // ~3 months

  const archiveUrl =
    `${ARCHIVE_BASE}/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${formatDate(archiveStart)}&end_date=${formatDate(archiveEnd)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  // Add current=temperature_2m to get real-time temperature
  const forecastUrl =
    `${FORECAST_BASE}/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
    `&current=temperature_2m` +
    `&forecast_days=7&timezone=auto`;

  const [archiveRes, forecastRes] = await Promise.all([
    fetch(archiveUrl),
    fetch(forecastUrl),
  ]);

  if (!archiveRes.ok || !forecastRes.ok) {
    throw new Error("Failed to fetch climate data");
  }

  const [archiveData, forecastData] = await Promise.all([
    archiveRes.json() as Promise<{ daily: DailyWeather }>,
    forecastRes.json() as Promise<{ daily: DailyWeather; current?: CurrentWeather }>,
  ]);

  return {
    archive: archiveData.daily,
    forecast: forecastData.daily,
    current: forecastData.current ?? null,
  };
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function avg(arr: (number | null | undefined)[]): number {
  const valid = arr.filter((v): v is number => v != null && !isNaN(v as number));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function toRisk(value: number, modThreshold: number, highThreshold: number): RiskLevel {
  if (value >= highThreshold) return "high";
  if (value >= modThreshold) return "moderate";
  return "low";
}

function toInverseRisk(value: number, modThreshold: number, highThreshold: number): RiskLevel {
  // Higher value = LOWER risk (e.g. temperature: higher = less cold)
  if (value <= highThreshold) return "high";
  if (value <= modThreshold) return "moderate";
  return "low";
}

// ─── ClimateProfile computation ───────────────────────────────────────────────

export function computeClimateSkInScore(
  archive: DailyWeather,
  forecast: DailyWeather,
  city: string,
  country: string,
  lat: number,
  lon: number,
  current?: CurrentWeather | null
): ClimateProfile {
  const allMaxTemps = [...(archive.temperature_2m_max ?? []), ...(forecast.temperature_2m_max ?? [])];
  const allMinTemps = [...(archive.temperature_2m_min ?? []), ...(forecast.temperature_2m_min ?? [])];
  const allPrecip   = [...(archive.precipitation_sum ?? []),  ...(forecast.precipitation_sum ?? [])];
  const uvSamples   = forecast.uv_index_max ?? [];

  const avgMaxTemp = Math.round(avg(allMaxTemps) * 10) / 10;
  const avgMinTemp = Math.round(avg(allMinTemps) * 10) / 10;
  const avgPrecip  = Math.round(avg(allPrecip) * 10) / 10;   // mm/day
  const avgUV      = Math.round(avg(uvSamples) * 10) / 10;

  // ── Today's forecast (first entry in forecast arrays) ───────────────────────
  const todayMaxTemp = forecast.temperature_2m_max?.[0] ?? null;
  const todayMinTemp = forecast.temperature_2m_min?.[0] ?? null;

  // ── Current real-time temperature ───────────────────────────────────────────
  const currentTemp = current?.temperature_2m != null
    ? Math.round(current.temperature_2m * 10) / 10
    : null;

  // ── 5 risk dimensions ───────────────────────────────────────────────────────

  // Cold risk: based on average minimum temperature
  // < 0 °C → high,  0–5 °C → moderate,  > 5 °C → low
  const coldRisk = toInverseRisk(avgMinTemp, 5, 0);

  // Heat risk: based on average maximum temperature
  // > 35 °C → high,  28–35 °C → moderate,  < 28 °C → low
  const heatRisk = toRisk(avgMaxTemp, 28, 35);

  // Humidity risk: based on average daily precipitation
  // > 4 mm/day → high,  2–4 mm/day → moderate,  < 2 mm/day → low
  const humidityRisk = toRisk(avgPrecip, 2, 4);

  // Dryness risk: low precip + warm temps → barrier threat
  let drynessRisk: RiskLevel;
  if (avgPrecip < 0.5 && avgMaxTemp > 10) drynessRisk = "high";
  else if (avgPrecip < 1.5 || avgMinTemp < 0) drynessRisk = "moderate";
  else drynessRisk = "low";

  // UV risk: based on average UV index from 7-day forecast
  // > 6 → high,  3–6 → moderate,  < 3 → low
  const uvRisk = toRisk(avgUV, 3, 6);

  // ── Derive legacy climateType (priority: cold_dry > humid > hot_dry > mild) ─
  let climateType: ClimateProfile["climateType"] = "climate_mild";
  if (coldRisk !== "low" && humidityRisk === "low") {
    climateType = "climate_cold_dry";
  } else if (humidityRisk === "high" || (humidityRisk === "moderate" && heatRisk !== "low")) {
    climateType = "climate_humid";
  } else if (heatRisk === "high" || uvRisk === "high") {
    climateType = "climate_hot_dry";
  }

  return {
    city,
    country,
    lat,
    lon,
    drynessRisk,
    humidityRisk,
    uvRisk,
    coldRisk,
    heatRisk,
    climateType,
    avgMaxTemp,
    avgMinTemp,
    avgUV,
    avgPrecip,
    currentTemp,
    todayMaxTemp,
    todayMinTemp,
  };
}
