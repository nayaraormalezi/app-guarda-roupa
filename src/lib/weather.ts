/** Open-Meteo: geocoding + forecast (no API key). */

export interface GeoCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface DayWeather {
  weather: string;
  tempMax: number;
  tempMin: number;
  /** Average for outfit engine */
  temp: number;
  code: number;
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "☁️";
  if (code <= 57) return "🌦";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌧";
  if (code <= 86) return "❄️";
  if (code <= 99) return "⛈";
  return "🌤";
}

export function weatherLabelFromEmoji(emoji?: string): string {
  switch (emoji) {
    case "☀️":
      return "Ensolarado";
    case "⛅":
      return "Parcialmente nublado";
    case "☁️":
      return "Nublado";
    case "🌦":
      return "Chuvisco";
    case "🌧":
      return "Chuva";
    case "❄️":
      return "Frio";
    case "⛈":
      return "Tempestade";
    default:
      return "Clima do dia";
  }
}

export function formatTempRange(tempMax?: number, tempMin?: number): string {
  if (tempMax == null || tempMin == null) return "—";
  return `${tempMax}° / ${tempMin}°`;
}

export async function searchCities(query: string): Promise<GeoCity[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar cidade");
  const data = (await res.json()) as {
    results?: {
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
      admin1?: string;
    }[];
  };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    admin1: r.admin1,
  }));
}

export async function fetchWeekWeather(latitude: number, longitude: number): Promise<DayWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao buscar clima");
  const data = (await res.json()) as {
    daily?: {
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  const codes = data.daily?.weather_code ?? [];
  const maxes = data.daily?.temperature_2m_max ?? [];
  const mins = data.daily?.temperature_2m_min ?? [];

  return Array.from({ length: 7 }, (_, i) => {
    const code = codes[i] ?? 0;
    const tempMax = Math.round(maxes[i] ?? 25);
    const tempMin = Math.round(mins[i] ?? 18);
    return {
      code,
      tempMax,
      tempMin,
      temp: Math.round((tempMax + tempMin) / 2),
      weather: weatherCodeToEmoji(code),
    };
  });
}
