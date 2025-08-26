"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Quote {
  id: string;
  status: string;
  total: number | null;
  updated_at: string;
}

export default function AdminQuotesPage() {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("quotes")
        .select("id,status,total,updated_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setQuotes(data || []);
    };
    load();

    const channel = supabase
      .channel("quotes")
      .on("broadcast", { event: "status" }, (payload) => {
        const { id, status } = payload.payload as { id: string; status: string };
        setQuotes((prev) => {
          const existing = prev.find((q) => q.id === id);
          if (existing) {
            return prev.map((q) => (q.id === id ? { ...q, status } : q));
          }
          return [
            { id, status, total: null, updated_at: new Date().toISOString() },
            ...prev,
          ];
        });
        if (status === "sent") {
          setNewIds((prev) => new Set(prev).add(id));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">
        Quotes
        {newIds.size > 0 && (
          <span className="ml-2 text-sm bg-red-500 text-white rounded px-2">
            {newIds.size} NEW
          </span>
        )}
      </h1>
      <ul className="space-y-2">
        {quotes.map((q) => (
          <li key={q.id} className="border p-4 rounded">
            <a href={`/admin/quotes/${q.id}`} className="text-blue-600 underline">
              {q.id}
            </a>
            <p className="text-sm">
              Status: {q.status}
              {newIds.has(q.id) && (
                <span className="ml-2 text-xs bg-red-500 text-white px-1 rounded">
                  NEW
                </span>
              )}
            </p>
            <p className="text-sm">Total: {q.total}</p>
          </li>
        ))}
        {!quotes.length && (
          <li className="text-sm text-gray-500">No quotes found</li>
        )}
      </ul>
    </div>
  );
}
