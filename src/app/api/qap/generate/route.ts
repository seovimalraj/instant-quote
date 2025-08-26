import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateQap } from "@/lib/qap";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";

const schema = z.object({
  partId: z.string().uuid(),
  material: z.string(),
  tolerance: z.string(),
  certification: z.string(),
  purpose: z.string(),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qap = await generateQap(body);
  const qapId = randomUUID();
  const path = `${user.id}/${qapId}.html`;

  await supabase.storage
    .from("documents")
    .upload(path, Buffer.from(qap.html, "utf8"), {
      contentType: "text/html",
    });

  await supabase.from("documents").insert({
    id: qapId,
    owner_id: user.id,
    part_id: body.partId,
    type: "qap",
    file_url: path,
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${path}`;

  return NextResponse.json({ qap_id: qapId, data: qap, url: publicUrl });
}
