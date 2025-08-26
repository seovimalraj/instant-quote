import { addDays, formatISO } from "date-fns";

const CAPACITY_PER_DAY_MIN = 8 * 60; // 8 hours
const schedule: Record<string, number> = {};

function dateKey(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export function reserve(date: string, minutes: number) {
  schedule[date] = (schedule[date] || 0) + minutes;
}

export function earliestAvailable(minutes: number): string {
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, i);
    const key = dateKey(d);
    const used = schedule[key] || 0;
    if (used + minutes <= CAPACITY_PER_DAY_MIN) {
      return key;
    }
  }
  return dateKey(addDays(today, 365));
}

export function available(minutes: number) {
  const standard = earliestAvailable(minutes);
  const expediteDate = addDays(new Date(standard), -2);
  const expedite = dateKey(expediteDate);
  return { standard, expedite };
}

export function clearSchedule() {
  for (const k of Object.keys(schedule)) delete schedule[k];
}
