import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { bufferGeometryFromMesh, geometryFromBufferGeometry } from "@/lib/geometry/stl";
import { projectedArea } from "@/lib/geometry/projectedArea";
import { stepRequestSchema } from "@/lib/validators/step";
import { geometrySchema } from "@/lib/validators/geometry";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof stepRequestSchema>;
  try {
    body = stepRequestSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { data: part, error } = await supabase
    .from("parts")
    .select("*")
    .eq("id", body.part_id)
    .eq("owner_id", user.id)
    .single();
  if (error || !part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  try {
    const geom = bufferGeometryFromMesh(body.mesh);
    const g = geometryFromBufferGeometry(geom);
    g.projected_area_mm2 = projectedArea(geom);
    const parsed = geometrySchema.parse(g);
    await supabase
      .from("parts")
      .update({
        volume_mm3: parsed.volume_mm3,
        surface_area_mm2: parsed.surface_area_mm2,
        bbox: parsed.bbox,
      })
      .eq("id", part.id);
    return NextResponse.json({ geometry: parsed });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to compute geometry" },
      { status: 500 },
    );
  }
}
