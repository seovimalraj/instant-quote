export const runtime = 'nodejs'
import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { earliestSlot } from "@/lib/capacity";

const querySchema = z.object({
  machineId: z.string().uuid(),
  minutes: z.coerce.number().min(1).max(20000),
  expedite: z.coerce.boolean().optional(),
  n: z.coerce.number().min(1).max(10).optional(),
});

// Provides upcoming available capacity dates for a machine.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let params;
  try {
    params = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { machineId, minutes, expedite = false, n = 5 } = params;
  const slots: { date: string; minutes: number }[] = [];
  let start = addDays(new Date(), expedite ? 1 : 3);
  for (let i = 0; i < n; i++) {
    const slot = await earliestSlot({
      machineId,
      minutesRequired: minutes,
      startDate: start,
    });
    if (!slot) break;
    slots.push(slot);
    start = addDays(new Date(slot.date), 1);
  }

  if (slots.length === 0) {
    return NextResponse.json({ ok: false, reason: "no_capacity" }, {
      status: 404,
    });
  }

  return NextResponse.json({ ok: true, machineId, expedite, slots });
}

