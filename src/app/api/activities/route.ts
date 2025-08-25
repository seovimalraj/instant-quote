import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { type, email, partId, partFileUrl, data } = body;

  await admin.from("activities").insert({
    actor_id: user?.id ?? null,
    part_id: partId ?? null,
    type,
    data: data ?? null,
  });

  if (type === "email_capture" && email) {
    await admin.from("abandoned_quotes").insert({
      email,
      part_file_url: partFileUrl ?? null,
      activity: data ?? null,
    });
  }

  return NextResponse.json({ ok: true });
}

