import { addDays, formatISO } from "date-fns";
import { createClient } from "./supabase/server";

interface CapacityDay {
  day: string;
  minutes_available: number | null;
  minutes_reserved: number | null;
}

/**
 * Find the earliest day within the scheduling window that has enough
 * available minutes for the requested work.
 */
export async function findCapacityDate(
  machineId: string,
  minutes: number,
  leadTime: "standard" | "expedite" = "standard"
): Promise<{ day: string; record?: CapacityDay }> {
  const supabase = createClient();
  const today = new Date();
  const windowStart = leadTime === "expedite" ? 1 : 3;
  const searchHorizon = 30;
  const start = addDays(today, windowStart);
  const end = addDays(today, windowStart + searchHorizon);
  const defaultDate = addDays(today, leadTime === "expedite" ? 3 : 7);

  const { data, error } = await supabase
    .from("capacity_days")
    .select("day, minutes_available, minutes_reserved")
    .eq("machine_id", machineId)
    .gte("day", formatISO(start, { representation: "date" }))
    .lte("day", formatISO(end, { representation: "date" }))
    .order("day");

  if (error || !data) {
    return { day: formatISO(defaultDate, { representation: "date" }) };
  }

  for (const d of data as CapacityDay[]) {
    const avail = (d.minutes_available ?? 0) - (d.minutes_reserved ?? 0);
    if (avail >= minutes) {
      return { day: d.day, record: d };
    }
  }

  return { day: formatISO(end, { representation: "date" }) };
}

/**
 * Reserve minutes of capacity for a machine and return the promise date.
 * If no existing capacity is available, the reservation is placed at the
 * end of the search window.
 */
export async function scheduleCapacity(
  machineId: string,
  minutes: number,
  leadTime: "standard" | "expedite" = "standard"
): Promise<string> {
  const { day, record } = await findCapacityDate(machineId, minutes, leadTime);
  const supabase = createClient();

  const minutes_available = record?.minutes_available ?? minutes;
  const minutes_reserved = (record?.minutes_reserved ?? 0) + minutes;

  await supabase
    .from("capacity_days")
    .upsert(
      {
        machine_id: machineId,
        day,
        minutes_available,
        minutes_reserved,
      },
      { onConflict: "machine_id,day" }
    );

  return new Date(day).toISOString();
}

