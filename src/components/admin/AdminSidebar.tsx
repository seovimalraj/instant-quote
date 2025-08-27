'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Cog, Layers, FileText, ShoppingCart, Users, Settings } from 'lucide-react';

const NAV = [
  { group: 'Overview', items: [ { href: '/admin', label: 'Dashboard', icon: LayoutDashboard } ] },
  { group: 'Operations', items: [
      { href: '/admin/machines', label: 'Machines', icon: Cog },
      { href: '/admin/materials', label: 'Materials', icon: Layers }
    ]
  },
  { group: 'Sales', items: [
      { href: '/admin/quotes', label: 'Quotes', icon: FileText },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users, disabled: true }
    ]
  },
  { group: 'Settings', items: [ { href: '/admin/settings', label: 'Settings', icon: Settings, disabled: true } ] }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block col-span-3 lg:col-span-2 p-4 space-y-5 bg-white border-r">
      <div className="px-2 text-lg font-semibold">Admin</div>
      {NAV.map((g) => (
        <div key={g.group} className="space-y-2">
          <div className="px-2 text-xs uppercase tracking-wide text-slate-500">{g.group}</div>
          <nav className="space-y-1">
            {g.items.map((n) => {
              const active = pathname?.startsWith(n.href);
              const C = n.icon as any;
              const cls = n.disabled ? 'opacity-50 pointer-events-none' : active ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50';
              return (
                <Link key={n.href} href={n.href} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cls}`}>
                  {C ? <C className="h-4 w-4"/> : null}
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
