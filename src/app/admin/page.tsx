export default function AdminDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card p-4"><div className="text-sm text-slate-600">Quotes (24h)</div><div className="text-2xl font-semibold">12</div></div>
      <div className="card p-4"><div className="text-sm text-slate-600">Orders</div><div className="text-2xl font-semibold">7</div></div>
      <div className="card p-4"><div className="text-sm text-slate-600">Revenue</div><div className="text-2xl font-semibold">$3,420</div></div>
    </div>
  );
}
