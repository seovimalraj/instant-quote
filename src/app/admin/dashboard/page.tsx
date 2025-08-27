export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import KpiCard from "@/components/admin/KpiCard";
import ListFeed from "@/components/admin/ListFeed";
import { getKpis, getFeeds } from "@/lib/metrics";
import { requireAdmin } from "@/lib/auth";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [kpis, feeds] = await Promise.all([getKpis(), getFeeds()]);

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Quotes by Status"
          value={Object.entries(kpis.quotes_by_status)
            .map(([s, c]) => `${s}: ${c}`)
            .join(", ")}
        />
        <KpiCard
          title="Revenue (30d)"
          value={`$${kpis.revenue_30d.toFixed(2)}`}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${(kpis.conversion_rate * 100).toFixed(1)}%`}
        />
        <KpiCard title="Abandoned Funnel" value={kpis.abandoned_funnel} />
        <KpiCard
          title="Orders in Production"
          value={kpis.orders_in_production}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListFeed
          title="Recent Messages"
          items={feeds.recent_messages.map((m: any) => ({
            id: m.id,
            primary: m.content,
            secondary: new Date(m.created_at).toLocaleString(),
          }))}
        />
        <ListFeed
          title="Latest Uploads"
          items={feeds.latest_uploads.map((p: any) => ({
            id: p.id,
            primary: p.file_name,
            secondary: new Date(p.created_at).toLocaleString(),
          }))}
        />
        <ListFeed
          title="Workload"
          items={feeds.workload.map((o: any) => ({
            id: o.id,
            primary: o.id,
            secondary: o.status,
          }))}
        />
      </div>
    </div>
  );
}
