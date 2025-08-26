export const runtime = 'nodejs'
import { NextResponse } from 'next/server';
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, context: { params: Record<string,string> }) {
  const { params } = context;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, context: { params: Record<string,string> }) {
  const { params } = context;
  const payload = await req.json();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, context: { params: Record<string,string> }) {
  const { params } = context;
  const supabase = await createClient();
  const { error } = await supabase.from("machines").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
