"use client";
import { useState } from 'react';

export default function MachineDetailClient({ machine, links }: { machine: any; links: any[] }) {
  const [state] = useState({ machine, links });
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{state.machine?.name ?? 'Machine'}</h1>
      <pre className="text-xs bg-slate-50 p-4 rounded border overflow-auto">{JSON.stringify(state.machine, null, 2)}</pre>
    </div>
  );
}
