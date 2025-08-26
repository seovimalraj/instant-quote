import { NextResponse } from "next/server";
import { z } from "zod";
import { reserve } from "@/lib/capacity";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  date: z.string(),
  minutes: z.number().min(0),
});

// Reserve capacity minutes for a specific date. Admin only.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  reserve(body.date, body.minutes);
  return NextResponse.json({ ok: true });
}
