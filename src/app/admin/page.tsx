import StatCard from '@/components/admin/ui/StatCard';
import SectionCard from '@/components/admin/ui/SectionCard';
import { LayoutDashboard, FileText, ShoppingCart, Layers } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const recent = [
    { id: 'Q-1007', customer: 'Acme Corp', amount: 1210, status: 'Sent', created: '2025-08-20' },
    { id: 'Q-1006', customer: 'Starline', amount: 860, status: 'Draft', created: '2025-08-19' },
    { id: 'Q-1005', customer: 'BlueSteel', amount: 3120, status: 'Accepted', created: '2025-08-18' }
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Quotes (24h)" value={12} subtext="vs. 9 yesterday" icon={FileText} trend={{ dir: 'up', value: '33%' }} />
        <StatCard title="Orders" value={7} subtext="open" icon={ShoppingCart} trend={{ dir: 'up', value: '8%' }} />
        <StatCard title="Revenue" value="$3,420" subtext="last 7d" icon={LayoutDashboard} trend={{ dir: 'down', value: '5%' }} />
        <StatCard title="Materials" value={24} subtext="active" icon={Layers} />
      </div>

      <SectionCard title="Recent Quotes" actions={<Link className="link" href="/admin/quotes">View all</Link>}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2">Quote</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="py-2"><Link className="link" href={`/admin/quotes/${r.id}`}>{r.id}</Link></td>
                  <td className="py-2">{r.customer}</td>
                  <td className="py-2">${r.amount.toLocaleString()}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
