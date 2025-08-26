"use client";
import { useState } from 'react';
import DataTable from '@/components/admin/DataTable';

export default function MaterialsClient({ initialRows }: { initialRows: any[] }) {
  const [rows] = useState(initialRows);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Materials</h1>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'category', header: 'Category' },
          { key: 'density_kg_m3', header: 'Density (kg/m³)' },
          { key: 'cost_per_kg', header: 'Cost/ kg' },
          { key: 'machinability_factor', header: 'Machinability' },
          { key: 'is_active', header: 'Active' }
        ]}
      />
    </div>
  );
}

