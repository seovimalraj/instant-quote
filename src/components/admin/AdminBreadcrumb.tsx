'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string,string> = {
  admin: 'Dashboard', machines: 'Machines', materials: 'Materials', quotes: 'Quotes', orders: 'Orders', customers: 'Customers', settings: 'Settings'
};

function toLabel(seg: string) { return LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1); }

export default function AdminBreadcrumb() {
  const pathname = usePathname() || '/admin';
  const segs = pathname.split('/').filter(Boolean);
  const trail = segs.slice(1); // drop leading 'admin'
  return (
    <nav className="text-sm text-slate-600">
      <ol className="flex items-center gap-2">
        <li><Link href="/admin" className="link">Admin</Link></li>
        {trail.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span>/</span>
            {i === trail.length - 1 ? (
              <span className="text-slate-900">{toLabel(s)}</span>
            ) : (
              <Link href={`/${segs.slice(0, i + 2).join('/')}`} className="link">{toLabel(s)}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
