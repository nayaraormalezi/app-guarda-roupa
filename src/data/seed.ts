import type { DayPlan } from "./types";
import { defaultFormalityFor, normalizeFormalityId, normalizeOccasionId } from "./types";

export { SEED_WARDROBE } from "./seed-wardrobe";

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/** Local calendar date key — avoid UTC shift from toISOString(). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dayPlanId(d: Date): string {
  return `day-${localDateKey(d)}`;
}

export function buildWeekPlan(
  from = new Date(),
  weatherDays?: { weather: string; temp: number; tempMax: number; tempMin: number }[]
): DayPlan[] {
  const occasions: DayPlan["occasionId"][] = [
    "casa",
    "trabalho",
    "faculdade",
    "trabalho",
    "encontro",
    "festa",
    "evento",
  ];
  const fallbackWeather = ["☀️", "☀️", "⛅", "🌤", "☁️", "🌧", "☀️"];
  const fallbackMax = [28, 26, 23, 25, 21, 19, 30];
  const fallbackMin = [18, 16, 14, 15, 12, 11, 20];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const tempMax = weatherDays?.[i]?.tempMax ?? fallbackMax[i];
    const tempMin = weatherDays?.[i]?.tempMin ?? fallbackMin[i];
    const temp = weatherDays?.[i]?.temp ?? Math.round((tempMax + tempMin) / 2);
    const occasionId = normalizeOccasionId(occasions[i]);
    return {
      id: dayPlanId(d),
      day: DAY_NAMES[d.getDay()],
      date: String(d.getDate()).padStart(2, "0"),
      weather: weatherDays?.[i]?.weather ?? fallbackWeather[i],
      temp,
      tempMax,
      tempMin,
      occasionId,
      formalityId: defaultFormalityFor(occasionId),
    };
  });
}

export function normalizeDayPlan(day: Partial<DayPlan> & Pick<DayPlan, "id" | "day" | "date">): DayPlan {
  const occasionId = normalizeOccasionId(day.occasionId);
  const formalityId = day.formalityId
    ? normalizeFormalityId(day.formalityId)
    : defaultFormalityFor(occasionId);
  const tempMax = day.tempMax ?? day.temp ?? 25;
  const tempMin = day.tempMin ?? (day.temp != null ? Math.max(0, day.temp - 8) : 18);
  return {
    id: day.id,
    day: day.day,
    date: day.date,
    weather: day.weather ?? "☀️",
    temp: day.temp ?? Math.round((tempMax + tempMin) / 2),
    tempMax,
    tempMin,
    occasionId,
    formalityId,
    outfitRefs: day.outfitRefs,
    used: day.used,
  };
}

export const DEFAULT_PREFERENCES = {
  displayName: "",
  city: "",
  styleTags: [] as string[],
  onboardingComplete: false,
  theme: "system" as const,
};
