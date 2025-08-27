'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/machines', label: 'Machines' },
  { href: '/admin/materials', label: 'Materials' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/orders', label: 'Orders' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block col-span-3 lg:col-span-2 p-4 space-y-4 bg-white border-r">
      <div className="text-lg font-semibold">Admin</div>
      <nav className="space-y-1">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`block px-3 py-2 rounded-xl ${pathname?.startsWith(n.href) ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
