"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EmailCaptureModal from "../modals/EmailCaptureModal";

const ACCEPTED = [".stl", ".step", ".stp", ".iges", ".igs"];

export default function PartDropzone() {
  const router = useRouter();
  const [drag, setDrag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      alert("Unsupported file type");
      return;
    }

    const res = await fetch("/api/upload/part", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });

    if (res.ok) {
      const { uploadUrl, part } = await res.json();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: file,
      });
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload",
          partId: part.id,
          data: { filename: file.name },
        }),
      });
      router.push(`/instant-quote?partId=${part.id}`);
      return;
    }

    if (res.status === 401) {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upload",
          data: { filename: file.name },
        }),
      });
      setPendingFile(file);
      setShowModal(true);
      return;
    }

    const err = await res.json().catch(() => ({}));
    alert(err.error || "Upload failed");
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${
          drag ? "bg-gray-100" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          id="file-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label htmlFor="file-input" className="block">
          <p className="text-gray-600">Drag & drop a CAD file or click to browse</p>
          <p className="text-xs text-gray-500 mt-2">STL, STEP, STP, IGES, IGS</p>
        </label>
      </div>
      <EmailCaptureModal
        open={showModal}
        onClose={() => setShowModal(false)}
        file={pendingFile}
      />
    </>
  );
}

