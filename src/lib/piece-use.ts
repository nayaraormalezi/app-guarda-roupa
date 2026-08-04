import type { ClothingItem } from "@/data/types";

/** Piece id → calendar date keys (YYYY-MM-DD) when the piece counted as used. */
export type PieceUseDays = Record<string, string[]>;

/**
 * Count a piece as used at most once per calendar day.
 * `add` increments uses only if that day is new; `remove` decrements if the day was logged.
 */
export function applyPieceUseDay(
  wardrobe: ClothingItem[],
  log: PieceUseDays,
  ids: string[],
  dateKey: string,
  direction: "add" | "remove"
): { wardrobe: ClothingItem[]; pieceUseDays: PieceUseDays } {
  const nextLog: PieceUseDays = { ...log };
  const delta = new Map<string, number>();

  for (const id of ids) {
    if (!id) continue;
    const days = [...(nextLog[id] ?? [])];
    const has = days.includes(dateKey);
    if (direction === "add" && !has) {
      nextLog[id] = [...days, dateKey].slice(-400);
      delta.set(id, 1);
    } else if (direction === "remove" && has) {
      const filtered = days.filter((d) => d !== dateKey);
      if (filtered.length) nextLog[id] = filtered;
      else delete nextLog[id];
      delta.set(id, -1);
    }
  }

  if (!delta.size) {
    return { wardrobe, pieceUseDays: nextLog };
  }

  return {
    pieceUseDays: nextLog,
    wardrobe: wardrobe.map((i) => {
      const d = delta.get(i.id);
      if (!d) return i;
      return { ...i, uses: Math.max(0, i.uses + d) };
    }),
  };
}

export function dateKeyFromDayId(dayId: string): string {
  return dayId.replace(/^day-/, "");
}
