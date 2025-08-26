import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeGeometry } from '@/lib/dfm';

const bodySchema = z.object({
  volume_mm3: z.number().positive(),
  surface_area_mm2: z.number().positive(),
  bbox: z.object({ x: z.number(), y: z.number(), z: z.number() }),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const body = bodySchema.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const overlays = analyzeGeometry(body.data);
  return NextResponse.json({ overlays });
}
