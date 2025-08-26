import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { available } from "@/lib/capacity";

const querySchema = z.object({
  minutes: z.coerce.number().min(0),
});

// Returns earliest available dates for standard and expedite lead times.
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "minutes required" }, { status: 400 });
  }
  const res = available(parsed.data.minutes);
  return NextResponse.json(res);
}
