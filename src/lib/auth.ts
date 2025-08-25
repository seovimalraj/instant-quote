import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireAuth() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (data?.role !== "admin" && data?.role !== "staff") {
    redirect("/");
  }

  return session;
}
