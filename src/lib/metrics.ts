import { createClient } from "./supabase/server";

export async function getKpis() {
  const supabase = createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [quotesRes, paymentsRes, abandonedRes, productionRes] =
    await Promise.all([
      supabase.from("quotes").select("status"),
      supabase
        .from("payments")
        .select("amount")
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("abandoned_quotes")
        .select("*", { count: "exact", head: true })
        .eq("is_claimed", false),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_production"),
    ]);

  const quotesByStatus = (quotesRes.data ?? []).reduce(
    (acc: Record<string, number>, q: any) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const revenue30d = (paymentsRes.data ?? []).reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  );

  const sent = (quotesRes.data ?? []).filter((q: any) => q.status === "sent")
    .length;
  const accepted = (quotesRes.data ?? []).filter((q: any) =>
    ["accepted", "paid", "in_production", "completed"].includes(q.status)
  ).length;
  const conversionRate = sent ? accepted / sent : 0;

  return {
    quotes_by_status: quotesByStatus,
    revenue_30d: revenue30d,
    conversion_rate: conversionRate,
    abandoned_funnel: abandonedRes.count ?? 0,
    orders_in_production: productionRes.count ?? 0,
  };
}

export async function getFeeds() {
  const supabase = createClient();

  const [messagesRes, uploadsRes, workloadRes] = await Promise.all([
    supabase
      .from("messages")
      .select("id,content,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("parts")
      .select("id,file_name,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select("id,status,created_at")
      .not("status", "eq", "closed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    recent_messages: messagesRes.data ?? [],
    latest_uploads: uploadsRes.data ?? [],
    workload: workloadRes.data ?? [],
  };
}
