export const runtime = 'nodejs'
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  quote_id: z.string().uuid(),
});

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
    body = schema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { data: quote, error } = await supabase
      .from("quotes")
      .update({ status: "sent" })
      .eq("id", body.quote_id)
      .select("id,status")
      .single();
    if (error) throw error;

    await supabase.from("activities").insert({
      actor_id: user.id,
      quote_id: body.quote_id,
      type: "quote_requested",
    });

    const channel = supabase.channel("quotes");
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "status",
      payload: { id: body.quote_id, status: "sent" },
    });
    await channel.unsubscribe();

    return NextResponse.json({ quote });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to request quote" }, { status: 500 });
  }
}
