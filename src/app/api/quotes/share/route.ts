import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { z } from "zod";

// API route to generate temporary share tokens for quotes.
const schema = z.object({
  quote_id: z.string().uuid(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = schema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const token = randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("quote_share_tokens").insert({
    token,
    quote_id: body.quote_id,
    expires_at: expires,
  });
  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create share token" },
      { status: 500 }
    );
  }

  return NextResponse.json({ token });
}

