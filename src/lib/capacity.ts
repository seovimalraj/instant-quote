import { addDays, formatISO } from "date-fns";
import { createClient } from "./supabase/server";

/**
 * Derive the number of minutes of machine capacity required for an item.
 * The item is expected to include either a `capacity_minutes_reserved`
 * property or a similar field inside `pricing_breakdown`.
 */
export function minutesNeededForItem(item: any): number {
  const minutes =
    item?.capacity_minutes_reserved ??
    item?.capacity_minutes ??
    item?.pricing_breakdown?.capacity_minutes_reserved ??
    item?.pricing_breakdown?.capacity_minutes ??
    0;
  return typeof minutes === "number" && minutes > 0 ? minutes : 0;
}

interface EarliestSlotArgs {
  machineId: string;
  minutesRequired: number;
  startDate?: Date;
  maxDays?: number;
  /** Optional flag for future use when differentiating expedite capacity */
  expedite?: boolean;
}

/**
 * Find the earliest date with enough remaining capacity for the requested
 * number of minutes. Scans forward day-by-day from `startDate` (defaults to
 * today) up to `maxDays`.
 */
export async function earliestSlot({
  machineId,
  minutesRequired,
  startDate,
  maxDays = 30,
}: EarliestSlotArgs): Promise<{ date: string; minutes: number } | null> {
  const start = startDate ? new Date(startDate) : new Date();
  const end = addDays(start, maxDays);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("machine_capacity_days")
    .select("day, minutes_available, minutes_reserved")
    .eq("machine_id", machineId)
    .gte("day", formatISO(start, { representation: "date" }))
    .lte("day", formatISO(end, { representation: "date" }))
    .order("day");

  if (error) {
    console.error("earliestSlot query failed", error.message);
    return null;
  }

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const date = formatISO(new Date(row.day), { representation: "date" });
    const avail = (row.minutes_available ?? 0) - (row.minutes_reserved ?? 0);
    map.set(date, avail);
  }

  for (let i = 0; i <= maxDays; i++) {
    const d = formatISO(addDays(start, i), { representation: "date" });
    const avail = map.get(d) ?? 0;
    if (avail >= minutesRequired && minutesRequired > 0) {
      return { date: d, minutes: avail };
    }
  }
  return null;
}

