import '@/styles/globals.css';
import { requireAdmin } from '@/lib/auth';
import { SignOutButton } from '@/components/SignOutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r p-4 hidden md:block">
          <div className="font-semibold mb-4 flex items-center justify-between">
            <span>Admin</span>
          </div>
          <nav className="space-y-2 text-sm">
            <a className="block" href="/admin">Dashboard</a>
            <a className="block" href="/admin/machines">Machines</a>
            <a className="block" href="/admin/materials">Materials</a>
            <a className="block" href="/admin/finishes">Finishes</a>
            <a className="block" href="/admin/tolerances">Tolerances</a>
            <a className="block" href="/admin/quotes">Quotes</a>
            <a className="block" href="/admin/capacity">Capacity</a>
          </nav>
          <div className="mt-6"><SignOutButton/></div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

