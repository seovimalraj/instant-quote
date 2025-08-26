"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

export default function CapacityClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows);
  const supabase = createClient();

  useEffect(() => {
    const sub = supabase
      .channel('capacity_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capacity' }, () => {
        // optional: re-fetch
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [supabase]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Capacity</h1>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left p-2">Day</th><th className="text-left p-2">Available</th><th className="text-left p-2">Reserved</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day} className="border-t">
              <td className="p-2">{format(new Date(r.day), 'yyyy-MM-dd')}</td>
              <td className="p-2">{r.minutes_available}</td>
              <td className="p-2">{r.minutes_reserved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
