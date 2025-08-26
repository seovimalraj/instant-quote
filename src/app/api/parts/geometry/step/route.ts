import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stepRequestSchema, StepRequest } from "@/lib/validators/step";
import { maxProjectedArea } from "@/lib/geometry/projectedArea";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: StepRequest;
  try {
    body = stepRequestSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const partId = body.partId;
  const { data: part, error: partErr } = await supabase
    .from("parts")
    .select("meta")
    .eq("id", partId)
    .eq("owner_id", user.id)
    .single();
  if (partErr || !part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  if ("fileUrl" in body) {
    return NextResponse.json(
      {
        error: "STEP parsing not implemented. Please provide a faceted mesh.",
      },
      { status: 501 },
    );
  } else if ("mesh" in body) {
    const result = maxProjectedArea(body.mesh.tris);

    const currentMeta = part.meta ?? {};
    await supabase
      .from("parts")
      .update({ meta: { ...currentMeta, projected_area_cm2: result.area_cm2 } })
      .eq("id", partId);

    return NextResponse.json(result);
  } else {
    return NextResponse.json({ error: "Mesh data required" }, { status: 400 });
  }
}
