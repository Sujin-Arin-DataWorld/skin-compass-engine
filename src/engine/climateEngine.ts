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

// ─── Geocoding ────────────────────────────────────────────────────────────────

export async function fetchCitySuggestions(
  query: string,
  lang: string = "en"
): Promise<GeoSuggestion[]> {
  if (!query || query.trim().length < 2) return [];
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(query.trim())}&count=15&language=${lang}&format=json`;

  console.log("[climateEngine] geocoding URL →", url);

  try {
    const res = await fetch(url);
    console.log("[climateEngine] response status:", res.status, res.statusText);

    if (!res.ok) {
      console.warn("[climateEngine] non-ok response — returning []");
      return [];
    }

    const data = (await res.json()) as { results?: GeoSuggestion[] };
    console.log("[climateEngine] raw JSON:", data);
    console.log("[climateEngine] results array:", data.results ?? "(no results key)");

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
): Promise<{ archive: DailyWeather; forecast: DailyWeather }> {
  const today = new Date();

  // Archive has a ~2-day processing lag
  const archiveEnd = new Date(today);
  archiveEnd.setDate(today.getDate() - 2);

  const archiveStart = new Date(archiveEnd);
  archiveStart.setDate(archiveEnd.getDate() - 89); // ~3 months

  const archiveUrl =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${formatDate(archiveStart)}&end_date=${formatDate(archiveEnd)}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
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
    forecastRes.json() as Promise<{ daily: DailyWeather }>,
  ]);

  return {
    archive: archiveData.daily,
    forecast: forecastData.daily,
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
  lon: number
): ClimateProfile {
  const allMaxTemps = [...(archive.temperature_2m_max ?? []), ...(forecast.temperature_2m_max ?? [])];
  const allMinTemps = [...(archive.temperature_2m_min ?? []), ...(forecast.temperature_2m_min ?? [])];
  const allPrecip   = [...(archive.precipitation_sum ?? []),  ...(forecast.precipitation_sum ?? [])];
  const uvSamples   = forecast.uv_index_max ?? [];

  const avgMaxTemp = Math.round(avg(allMaxTemps) * 10) / 10;
  const avgMinTemp = Math.round(avg(allMinTemps) * 10) / 10;
  const avgPrecip  = Math.round(avg(allPrecip) * 10) / 10;   // mm/day
  const avgUV      = Math.round(avg(uvSamples) * 10) / 10;

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
  };
}
