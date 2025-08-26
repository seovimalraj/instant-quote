export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createSignedUploadUrl } from "@/lib/storage";
import { uploadPartSchema } from "@/lib/validators/upload";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = uploadPartSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ext = path.extname(body.filename).toLowerCase();
  const partId = randomUUID();
  const objectPath = `${user.id}/${partId}${ext}`;

  try {
    const { signedUrl } = await createSignedUploadUrl(supabase, objectPath);

    const { data: part, error } = await supabase
      .from("parts")
      .insert({
        id: partId,
        owner_id: user.id,
        file_url: objectPath,
        file_name: body.filename,
        file_ext: ext,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ uploadUrl: signedUrl, part });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Upload initialization failed" },
      { status: 500 },
    );
  }
}
