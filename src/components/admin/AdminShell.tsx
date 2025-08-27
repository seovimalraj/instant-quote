'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/machines', label: 'Machines' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="hidden md:block col-span-3 lg:col-span-2 p-4 space-y-4 bg-white border-r">
        <div className="text-lg font-semibold">Admin</div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={`block px-3 py-2 rounded-xl ${pathname?.startsWith(n.href) ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'}`}>{n.label}</Link>
          ))}
        </nav>
        <div className="pt-4"><SignOutButton /></div>
      </aside>
      <main className="col-span-12 md:col-span-9 lg:col-span-10 p-4 md:p-6 space-y-4">
        <header className="card p-4 flex items-center justify-between">
          <div className="font-semibold">Control Panel</div>
          <div className="text-sm text-slate-600 hidden sm:block">TailAdmin-like Shell</div>
        </header>
        <section>{children}</section>
      </main>
    </div>
  );
}
