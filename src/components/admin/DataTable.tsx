"use client";
import * as React from 'react';

type Column = { key?: string; accessorKey?: string; header: string };

export default function DataTable(
  { rows = [], columns, rowLink, ..._rest }: { rows?: any[]; columns: Column[]; rowLink?: (r:any)=>string } & Record<string, any>
) {
  return (
    <div className="border rounded bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {columns.map((c, i) => (
              <th key={i} className="text-left p-2 border-b">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hover:bg-slate-50">
              {columns.map((c, j) => {
                const key = c.key ?? (c as any).accessorKey;
                const content = String(r[key]);
                return (
                  <td key={j} className="p-2">
                    {rowLink && j === 0 ? (
                      <a className="text-blue-600 hover:underline" href={rowLink(r)}>{content}</a>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
