import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geometrySchema } from "@/lib/validators/pricing";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { BufferGeometry, Vector3 } from "three";

const requestSchema = z.object({
  part_id: z.string().uuid(),
  geometry: geometrySchema.partial().optional(),
});

interface ComputedGeometry {
  volume_mm3: number;
  surface_area_mm2: number;
  bbox: [number, number, number];
}

function computeFromGeometry(geom: BufferGeometry): ComputedGeometry {
  geom.computeBoundingBox();
  const bbox = geom.boundingBox!;
  const size = bbox.getSize(new Vector3());
  const bboxArr: [number, number, number] = [size.x, size.y, size.z];

  const pos = geom.getAttribute("position");
  const vA = new Vector3();
  const vB = new Vector3();
  const vC = new Vector3();
  const cb = new Vector3();
  const ab = new Vector3();
  let volume = 0;
  let surface = 0;
  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);
    vC.fromBufferAttribute(pos, i + 2);
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    const cross = cb.cross(ab);
    const area = cross.length() * 0.5;
    surface += area;
    volume += vA.dot(cross) / 6;
  }
  volume = Math.abs(volume);
  surface = Math.abs(surface);
  return { volume_mm3: volume, surface_area_mm2: surface, bbox: bboxArr };
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { part_id, geometry: clientGeom } = body;
  const { data: part, error: partErr } = await supabase
    .from("parts")
    .select("*")
    .eq("id", part_id)
    .eq("owner_id", user.id)
    .single();
  if (partErr || !part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  let geometry: Partial<ComputedGeometry> = {};
  if (clientGeom) {
    geometry = { ...clientGeom } as any;
  } else if (part.file_ext?.toLowerCase() === ".stl") {
    try {
      const { data: file, error } = await supabase.storage
        .from("parts")
        .download(part.file_url);
      if (error) throw error;
      const arrayBuffer = await file.arrayBuffer();
      const loader = new STLLoader();
      const geom = loader.parse(arrayBuffer);
      geometry = computeFromGeometry(geom);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Failed to compute geometry" }, { status: 500 });
    }
  } else {
    // Unsupported format
    geometry = {
      volume_mm3: part.volume_mm3 ?? 0,
      surface_area_mm2: part.surface_area_mm2 ?? 0,
      bbox: (part.bbox as any) ?? [0, 0, 0],
    };
  }

  const update: any = {};
  if (geometry.volume_mm3 !== undefined) update.volume_mm3 = geometry.volume_mm3;
  if (geometry.surface_area_mm2 !== undefined)
    update.surface_area_mm2 = geometry.surface_area_mm2;
  if (geometry.bbox !== undefined) update.bbox = geometry.bbox;

  if (Object.keys(update).length > 0) {
    await supabase.from("parts").update(update).eq("id", part_id);
  }

  return NextResponse.json({ geometry: { ...part, ...geometry } });
}

