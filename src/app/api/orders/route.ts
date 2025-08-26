import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  quoteId: z.string().uuid(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = requestSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.errors?.[0]?.message ?? "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { quoteId } = body;

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId);

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      quote_id: quoteId,
      customer_id: quote.customer_id,
      currency: quote.currency,
      total: quote.total,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  for (const item of items ?? []) {
    await supabase.from("order_items").insert({
      order_id: order.id,
      quote_item_id: item.id,
      part_id: item.part_id,
      process_code: item.process_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    });
  }

  const defaultSteps = [
    "programming",
    "setup",
    "production",
    "qa",
    "shipping",
  ];
  for (const step of defaultSteps) {
    await supabase
      .from("production_steps")
      .insert({ order_id: order.id, step });
  }

  await supabase
    .from("quotes")
    .update({ status: "accepted" })
    .eq("id", quoteId);

  await supabase.from("activities").insert([
    {
      actor_id: user.id,
      quote_id: quoteId,
      order_id: order.id,
      type: "quote_accepted",
    },
    {
      actor_id: user.id,
      quote_id: quoteId,
      order_id: order.id,
      type: "order_created",
    },
  ]);

  return NextResponse.json({ orderId: order.id });
}

