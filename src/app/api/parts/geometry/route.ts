export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { POST as postSTL } from "./stl/route";
import { POST as postSTEP } from "./step/route";

const schema = z.object({ partId: z.string().uuid() }).passthrough();

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: part, error } = await supabase
    .from("parts")
    .select("file_ext")
    .eq("id", body.partId)
    .eq("owner_id", user.id)
    .single();
  if (error || !part) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  const ext = part.file_ext?.toLowerCase();
  const fwd = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(body),
  });

  if (ext === ".stl") {
    return postSTL(fwd);
  }
  if ([".step", ".stp", ".iges", ".igs"].includes(ext)) {
    return postSTEP(fwd);
  }

  return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
}

