import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { endOfMonth } from "date-fns";

const schema = z.object({
  machine_id: z.string().uuid(),
  day: z.string(),
  minutes_available: z.number(),
  minutes_reserved: z.number().optional(),
});

const patchSchema = z.object({
  machine_id: z.string().uuid(),
  day: z.string(),
  minutes_reserved: z.number(),
});

export async function GET(req: Request) {
  await requireAdmin();
  const { searchParams } = new URL(req.url);
  const machineId = searchParams.get("machine_id");
  const month = searchParams.get("month");
  if (!machineId || !month) {
    return NextResponse.json(
      { error: "machine_id and month required" },
      { status: 400 }
    );
  }
  const start = new Date(`${month}-01`);
  const end = endOfMonth(start);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capacity_days")
    .select("*")
    .eq("machine_id", machineId)
    .gte("day", start.toISOString())
    .lte("day", end.toISOString())
    .order("day");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  await requireAdmin();
  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("capacity_days")
    .upsert(
      {
        machine_id: body.machine_id,
        day: body.day,
        minutes_available: body.minutes_available,
        minutes_reserved: body.minutes_reserved ?? 0,
      },
      { onConflict: "machine_id,day" }
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  await requireAdmin();
  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const supabase = createClient();
  const { data: existing, error: exErr } = await supabase
    .from("capacity_days")
    .select("minutes_available, minutes_reserved")
    .eq("machine_id", body.machine_id)
    .eq("day", body.day)
    .single();
  if (exErr && exErr.code !== "PGRST116") {
    return NextResponse.json({ error: exErr.message }, { status: 500 });
  }
  const minutes_available = existing?.minutes_available ?? 0;
  const minutes_reserved = (existing?.minutes_reserved ?? 0) + body.minutes_reserved;
  const { data, error } = await supabase
    .from("capacity_days")
    .upsert(
      {
        machine_id: body.machine_id,
        day: body.day,
        minutes_available,
        minutes_reserved,
      },
      { onConflict: "machine_id,day" }
    )
    .select("*")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

