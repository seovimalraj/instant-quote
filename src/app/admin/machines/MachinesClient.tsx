"use client";
import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import Link from 'next/link';

export default function MachinesClient({ initialRows }: { initialRows: any[] }) {
  const [rows] = useState(initialRows);
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Machines</h1>
        <Link className="text-blue-600 hover:underline" href="/admin/machines/new">Add Machine</Link>
      </div>
      <DataTable rows={rows} columns={[{ key: 'name', header: 'Name' }, { key: 'process_kind', header: 'Process' }, { key: 'is_active', header: 'Active' }]} rowLink={(r:any)=>`/admin/machines/${r.id}`} />
    </div>
  );
}
