"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { z, ZodSchema } from "zod";
import { createClient } from "@/lib/supabase/client";
import ModalForm, { Field } from "./ModalForm";

interface DataTableProps {
  table: string;
  columns: ColumnDef<any, any>[];
  schema: ZodSchema<any>;
  fields: Field[];
  filterKey?: string;
  select?: string;
  eqFilters?: Record<string, any>;
  insertDefaults?: Record<string, any>;
  initialValues?: any;
  onValidate?: (values: any, existing?: any) => Promise<string | null>;
}

const PAGE_SIZE = 10;

export default function DataTable({
  table,
  columns,
  schema,
  fields,
  filterKey = "name",
  select,
  eqFilters,
  insertDefaults,
  initialValues,
  onValidate,
}: DataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    let query = supabase
      .from(table)
      .select(select || "*", { count: "exact" })
      .order(filterKey, { ascending: true })
      .ilike(filterKey, `%${filter}%`)
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (eqFilters) {
      Object.entries(eqFilters).forEach(([k, v]) => {
        query = query.eq(k, v);
      });
    }
    const { data, count } = await query;
    setData(data || []);
    setPageCount(count ? Math.ceil(count / PAGE_SIZE) : 0);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from(table).delete().eq("id", id);
    loadData();
  };

  const toggleActive = async (row: any) => {
    await supabase
      .from(table)
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    loadData();
  };

  const handleSubmit = async (values: any) => {
    try {
      const parsed = schema.parse(values);
      if (onValidate) {
        const msg = await onValidate(parsed, editing || undefined);
        if (msg) {
          setError(msg);
          return;
        }
      }
      if (editing) {
        await supabase.from(table).update(parsed).eq("id", editing.id);
      } else {
        await supabase.from(table).insert({ ...(insertDefaults || {}), ...parsed });
      }
      setOpen(false);
      setEditing(null);
      setError(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const mergedColumns: ColumnDef<any, any>[] = [
    ...columns,
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original.is_active}
          onChange={() => toggleActive(row.original)}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="space-x-2">
          <button
            className="text-blue-600"
            onClick={() => {
              setEditing(row.original);
              setOpen(true);
            }}
          >
            Edit
          </button>
          <button
            className="text-red-600"
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const tableInstance = useReactTable({
    data,
    columns: mergedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Filter"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        />
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </div>
      <table className="min-w-full border">
        <thead>
          {tableInstance.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="border px-2 py-1 text-left">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {tableInstance.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center mt-2">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {Math.max(pageCount, 1)}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page + 1 >= pageCount}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      {open && (
        <ModalForm
          open={open}
          onClose={() => {
            setOpen(false);
            setEditing(null);
            setError(null);
          }}
          schema={schema}
          fields={fields}
          initialValues={editing || initialValues || {}}
          onSubmit={handleSubmit}
          error={error}
        />
      )}
    </div>
  );
}

export type { Field } from "./ModalForm";

