"use client";
import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';

export default function FinishesClient({ initialRows }: { initialRows: any[] }) {
  const [rows] = useState(initialRows);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Finishes</h1>
      <DataTable rows={rows} columns={[{ key: 'name', header: 'Name' }, { key: 'type', header: 'Type' }, { key: 'is_active', header: 'Active' }]} />
    </div>
  );
}
