"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
// Lists quote-related activities in chronological order.
interface Props {
  quoteId: string;
}

interface Activity {
  id: string;
  type: string;
  created_at: string;
  data?: any;
}

export default function ActivityLog({ quoteId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("activities")
      .select("id,type,created_at,data")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setActivities(data || []);
      });
  }, [quoteId]);

  if (!activities.length) {
    return <p className="text-sm">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {activities.map((a) => (
        <li key={a.id} className="border rounded p-2">
          <div className="text-sm">{a.type}</div>
          <div className="text-xs text-gray-500">
            {new Date(a.created_at).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

