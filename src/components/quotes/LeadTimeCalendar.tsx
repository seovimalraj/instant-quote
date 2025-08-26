"use client";

import { useEffect, useState } from "react";

interface Availability {
  standard: string[];
  expedite: string[];
}

interface Props {
  machineId: string;
}

export default function LeadTimeCalendar({ machineId }: Props) {
  const [availability, setAvailability] = useState<Availability | null>(null);

  useEffect(() => {
    if (!machineId) return;
    fetch(`/api/capacity/available?machineId=${machineId}`)
      .then((res) => res.json())
      .then((data) => setAvailability(data));
  }, [machineId]);

  if (!availability) {
    return <p className="text-sm">Loading calendar...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">Standard</h3>
        <div className="flex flex-wrap gap-2">
          {availability.standard.map((d) => (
            <span
              key={d}
              className="px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-1">Expedite</h3>
        <div className="flex flex-wrap gap-2">
          {availability.expedite.map((d) => (
            <span
              key={d}
              className="px-2 py-1 bg-yellow-100 rounded text-sm"
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

