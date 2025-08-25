"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmailCaptureModalProps {
  open: boolean;
  onClose: () => void;
  file?: File | null;
}

export default function EmailCaptureModal({ open, onClose, file }: EmailCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "email_capture",
        email,
        data: { filename: file?.name },
      }),
    });
    setSubmitting(false);
    onClose();
    router.push("/instant-quote");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-md p-6 w-full max-w-sm shadow"
      >
        <h2 className="text-lg font-semibold mb-4">Enter your email</h2>
        <input
          type="email"
          required
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 text-sm" 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
            disabled={submitting}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

