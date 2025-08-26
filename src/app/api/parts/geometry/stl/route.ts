import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { parseSTL } from '@/lib/geometry/stl';
import { stlGeometrySchema } from '@/lib/validators/geometry';

const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150MB
const ALLOWED_TYPES = ['application/octet-stream', 'model/stl'];

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof stlGeometrySchema>;
  try {
    body = stlGeometrySchema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { partId, fileUrl, uploadId, unitsHint } = body;

  const { data: part, error: partErr } = await supabase
    .from('parts')
    .select('*')
    .eq('id', partId)
    .eq('owner_id', user.id)
    .single();
  if (partErr || !part) {
    return NextResponse.json({ error: 'Part not found' }, { status: 404 });
  }

  const path = fileUrl || uploadId || part.file_url;
  if (!path) {
    return NextResponse.json({ error: 'File path missing' }, { status: 400 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('parts')
    .createSignedUrl(path, 60);
  if (signErr || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
  }

  const resp = await fetch(signed.signedUrl);
  if (!resp.ok) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 400 });
  }
  const size = Number(resp.headers.get('content-length') || '0');
  if (size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  const type = resp.headers.get('content-type')?.split(';')[0].toLowerCase();
  if (type && !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  }

  const arrayBuffer = await resp.arrayBuffer();
  let geom;
  try {
    geom = parseSTL(arrayBuffer, { unitsHint });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to parse STL' }, { status: 400 });
  }

  const bboxSize: [number, number, number] = [
    geom.bbox.max[0] - geom.bbox.min[0],
    geom.bbox.max[1] - geom.bbox.min[1],
    geom.bbox.max[2] - geom.bbox.min[2],
  ];

  const currentMeta = part.meta ?? {};
  const { error: updErr } = await supabase
    .from('parts')
    .update({
      bbox: bboxSize,
      surface_area_mm2: geom.surfaceArea_mm2,
      volume_mm3: geom.volume_mm3,
      meta: { ...currentMeta, units: geom.units },
    })
    .eq('id', partId);
  if (updErr) {
    return NextResponse.json({ error: 'Failed to persist geometry' }, { status: 500 });
  }

  return NextResponse.json({
    geometry: {
      bbox: bboxSize,
      surface_area_mm2: geom.surfaceArea_mm2,
      volume_mm3: geom.volume_mm3,
      units: geom.units,
    },
  });
}
