import { NextRequest, NextResponse } from "next/server";
import { evaluateDfM } from "@/lib/dfm";
import { z } from "zod";

const schema = z.object({
  partId: z.string().uuid().optional(),
  material: z.string(),
  tolerance: z.string(),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { material, tolerance } = body;

  const geometry: any = {
    thickness_mm: tolerance === "0.002" ? 0.3 : 1.0,
    hole_depth_diameter_ratio: material === "steel" ? 4 : 7,
    max_overhang_deg: material === "plastic" ? 30 : 60,
  };

  const hints = evaluateDfM("cnc_milling", geometry);

  return NextResponse.json({ hints });
}
