'use client';

import { Search } from 'lucide-react';
import AdminBreadcrumb from './AdminBreadcrumb';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default function AdminHeader() {
  return (
    <header className="card p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <AdminBreadcrumb />
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            placeholder="Search"
            className="pl-9 pr-3 py-2 rounded-xl border text-sm"
          />
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
