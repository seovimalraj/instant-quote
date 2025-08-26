"use client";
import { useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { createClient } from '@/lib/supabase/client';

export default function CertificationsClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows);
  const supabase = createClient();
  // Add inline CRUD via supabase client if needed
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Certifications</h1>
      <DataTable rows={rows} columns={[{ key: 'name', header: 'Name' }, { key: 'code', header: 'Code' }]} />
    </div>
  );
}
