"use client";

import { useState } from "react";

interface MarkQuotePanelProps {
  quoteId: string;
  currentStatus: string;
  allowedStatuses?: string[];
  onStatusChange?: (newStatus: string) => void;
  /** callback when an activity has been recorded */
  onActivityAdded?: (activity: any) => void;
}

export default function MarkQuotePanel({
  quoteId,
  currentStatus,
  allowedStatuses = ["estimate", "ordered", "cancelled"],
  onStatusChange,
  onActivityAdded,
}: MarkQuotePanelProps) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const updateStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        const activityRes = await fetch(`/api/quotes/${quoteId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: note, type: `status:${status}` }),
        });
        if (activityRes.ok) {
          const activity = await activityRes.json();
          onActivityAdded?.(activity);
        }
        onStatusChange?.(status);
        setNote("");
      } else {
        console.error(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="status" className="text-sm">Status</label>
        <select
          id="status"
          className="border rounded p-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {allowedStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={3}
        placeholder="Add a note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        disabled={saving}
        onClick={updateStatus}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update Status"}
      </button>
    </div>
  );
}

