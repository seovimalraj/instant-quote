import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns";

export default async function CapacityPage() {
  await requireAdmin();
  return <ClientPage />;
}

function ClientPage() {
  "use client";

  const [machines, setMachines] = useState<any[]>([]);
  const [machineId, setMachineId] = useState<string>("");
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [days, setDays] = useState<Record<string, any>>({});
  const [defaultMinutes, setDefaultMinutes] = useState(480);

  useEffect(() => {
    const loadMachines = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("machines")
        .select("id,name")
        .order("name");
      setMachines(data || []);
      if (data?.[0]) setMachineId(data[0].id);
    };
    loadMachines();
  }, []);

  useEffect(() => {
    if (!machineId) return;
    const load = async () => {
      const res = await fetch(
        `/api/capacity/days?machine_id=${machineId}&month=${format(
          month,
          "yyyy-MM"
        )}`
      );
      const data = await res.json();
      const map: Record<string, any> = {};
      data.forEach((d: any) => {
        map[d.day] = d;
      });
      setDays(map);
    };
    load();
  }, [machineId, month]);

  const addMonth = async () => {
    if (!machineId) return;
    const allDays = eachDayOfInterval({
      start: month,
      end: endOfMonth(month),
    });
    for (const d of allDays) {
      await fetch("/api/capacity/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: machineId,
          day: format(d, "yyyy-MM-dd"),
          minutes_available: defaultMinutes,
          minutes_reserved: 0,
        }),
      });
    }
    const res = await fetch(
      `/api/capacity/days?machine_id=${machineId}&month=${format(
        month,
        "yyyy-MM"
      )}`
    );
    const data = await res.json();
    const map: Record<string, any> = {};
    data.forEach((d: any) => {
      map[d.day] = d;
    });
    setDays(map);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Capacity Calendar</h1>
      <div className="flex items-center space-x-2">
        <select
          className="border px-2 py-1"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
        >
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          Prev
        </button>
        <span>{format(month, "MMMM yyyy")}</span>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => setMonth(addMonths(month, 1))}
        >
          Next
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          className="border px-2 py-1"
          value={defaultMinutes}
          onChange={(e) => setDefaultMinutes(Number(e.target.value))}
        />
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={addMonth}
        >
          Add Capacity
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {eachDayOfInterval({ start: month, end: endOfMonth(month) }).map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const cap = days[key];
          return (
            <div key={key} className="border p-2 text-sm">
              <p className="font-semibold">{format(d, "d")}</p>
              <p>A: {cap?.minutes_available ?? 0}</p>
              <p>R: {cap?.minutes_reserved ?? 0}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

