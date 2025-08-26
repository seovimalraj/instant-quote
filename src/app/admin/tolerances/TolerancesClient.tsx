"use client";
import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';

export default function TolerancesClient({ initialRows }: { initialRows: any[] }) {
  const [rows] = useState(initialRows);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tolerances</h1>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'tol_min_mm', header: 'Min (mm)' },
          { key: 'tol_max_mm', header: 'Max (mm)' },
          { key: 'cost_multiplier', header: 'Cost ×' },
          { key: 'is_active', header: 'Active' }
        ]}
      />
    </div>
  );
}

