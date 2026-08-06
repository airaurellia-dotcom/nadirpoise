/**
 * NASA POWER API client for solar radiation and temperature data.
 *
 * Endpoint: https://power.larc.nasa.gov/api/temporal/daily/point
 * Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 */

export interface SolarDay {
  date: string; // YYYYMMDD
  temperatureC: number | null;  // T2M — average temperature at 2m (°C)
  solarRadiation: number | null; // ALLSKY_SFC_SW_DWN — all-sky surface shortwave downward irradiation (MJ/m²/day)
}

export interface SolarData {
  location: { lat: number; lon: number };
  startDate: string;
  endDate: string;
  days: SolarDay[];
  averageRadiation: number;
  minRadiation: number;
  maxRadiation: number;
  /** Light-exposure calibration factor (0–1). Lower = less natural light available */
  lightExposureCalibration: number;
}

/**
 * Fetch daily solar radiation and temperature data from the NASA POWER API.
 *
 * @param lat Latitude
 * @param lon Longitude
 * @param startDate ISO date string or YYYYMMDD
 * @param endDate ISO date string or YYYYMMDD
 */
export async function fetchSolarData(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
): Promise<SolarData> {
  // Convert ISO to YYYYMMDD if needed
  const fmtDate = (d: string) => d.replace(/-/g, "").slice(0, 8);

  const params = new URLSearchParams({
    parameters: "T2M,ALLSKY_SFC_SW_DWN",
    community: "RE",
    longitude: lon.toString(),
    latitude: lat.toString(),
    start: fmtDate(startDate),
    end: fmtDate(endDate),
    format: "JSON",
  });

  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?${params}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA POWER API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Parse the response structure
  const properties = data.properties?.parameter;
  if (!properties) {
    throw new Error("Unexpected NASA POWER API response format — missing properties.parameter");
  }

  const t2mData = properties.T2M ?? {};
  const solarData = properties.ALLSKY_SFC_SW_DWN ?? {};

  // Collect all dates between start and end
  const allDates = Object.keys(t2mData).length > 0
    ? Object.keys(t2mData).sort()
    : Object.keys(solarData).sort();

  const days: SolarDay[] = allDates.map((dateStr) => ({
    date: dateStr,
    temperatureC: t2mData[dateStr] ?? null,
    solarRadiation: solarData[dateStr] ?? null,
  }));

  // Compute statistics
  const radiationValues = days
    .map((d) => d.solarRadiation)
    .filter((v): v is number => v !== null);

  const avgRad = radiationValues.length > 0
    ? radiationValues.reduce((a, b) => a + b, 0) / radiationValues.length
    : 0;

  const minRad = radiationValues.length > 0 ? Math.min(...radiationValues) : 0;
  const maxRad = radiationValues.length > 0 ? Math.max(...radiationValues) : 0;

  // Calibration factor: how much natural light is available relative to tropical baseline
  // Tropical baseline ~25 MJ/m²/day. Factor of 0 = pitch dark, 1 = bright tropical sun.
  const lightExposureCalibration = Math.min(1, Math.max(0, avgRad / 25));

  return {
    location: { lat, lon },
    startDate,
    endDate,
    days,
    averageRadiation: avgRad,
    minRadiation: minRad,
    maxRadiation: maxRad,
    lightExposureCalibration,
  };
}

/**
 * Get a text description of the light exposure calibration.
 */
export function lightExposureDescription(calibration: number): string {
  if (calibration < 0.2) return "Very low natural light — bright-light exposure at night-shift start is critical";
  if (calibration < 0.4) return "Low natural light — supplement with bright artificial light during night-shift start";
  if (calibration < 0.6) return "Moderate natural light — standard bright-light protocol recommended";
  if (calibration < 0.8) return "Good natural light — bright-light exposure still beneficial";
  return "Strong natural light — blue-light blocking on post-night commute especially important";
}

/**
 * Get intensity level for the light recommendation badge.
 */
export function lightExposureIntensity(calibration: number): "high" | "moderate" | "low" {
  if (calibration < 0.35) return "high";
  if (calibration < 0.6) return "moderate";
  return "low";
}

/**
 * Generate today-plus-7 date range in ISO format.
 */
export function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(now), end: fmt(end) };
}