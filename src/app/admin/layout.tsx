import AdminShell from '@/components/admin/AdminShell';
import { requireAdmin } from '@/lib/auth';
import '@/styles/globals.css';

export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
