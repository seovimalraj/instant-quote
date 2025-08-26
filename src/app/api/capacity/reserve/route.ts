import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  machineId: z.string().uuid(),
  day: z.string(),
  minutes: z.number().int().min(1).max(20000),
});

export async function POST(req: Request) {
  await requireAdmin();
  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: exErr } = await supabase
    .from("machine_capacity_days")
    .select("minutes_available, minutes_reserved")
    .eq("machine_id", body.machineId)
    .eq("day", body.day)
    .single();
  if (exErr && exErr.code !== "PGRST116") {
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  }

  const minutes_available = existing?.minutes_available ?? 0;
  const minutes_reserved = (existing?.minutes_reserved ?? 0) + body.minutes;

  const { data, error } = await supabase
    .from("machine_capacity_days")
    .upsert(
      {
        machine_id: body.machineId,
        day: body.day,
        minutes_available,
        minutes_reserved,
      },
      { onConflict: "machine_id,day" }
    )
    .select("machine_id, day, minutes_available, minutes_reserved")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, record: data });
}

