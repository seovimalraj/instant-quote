"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED = [
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".stl",
  ".obj",
  ".dxf",
  ".sldprt",
];

interface Hint {
  severity: "info" | "warning" | "error";
  message: string;
  metric?: number | string;
}

function CadViewer({ file }: { file: File | null }) {
  return (
    <div className="w-full h-64 border rounded flex items-center justify-center bg-gray-50">
      {file ? <p className="text-sm">{file.name}</p> : <p className="text-sm text-gray-500">No file loaded</p>}
    </div>
  );
}

function DFMPanel({ hints }: { hints: Hint[] }) {
  if (!hints.length) return null;
  return (
    <div className="mt-4 space-y-2">
      {hints.map((h, i) => (
        <div
          key={i}
          className={`p-2 border-l-4 rounded bg-gray-100 text-sm ${
            h.severity === "error"
              ? "border-red-500"
              : h.severity === "warning"
              ? "border-yellow-500"
              : "border-blue-500"
          }`}
        >
          {h.message}
          {h.metric !== undefined && <span className="ml-1 text-xs">({h.metric})</span>}
        </div>
      ))}
    </div>
  );
}

export default function DfmPage() {
  const router = useRouter();
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [partId, setPartId] = useState<string | null>(null);
  const [material, setMaterial] = useState("aluminum");
  const [tolerance, setTolerance] = useState("0.005");
  const [certification, setCertification] = useState("ISO");
  const [purpose, setPurpose] = useState("");
  const [hints, setHints] = useState<Hint[]>([]);

  const uploadAndAnalyze = useCallback(
    async (f: File) => {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED.includes(ext)) {
        alert("Unsupported file type");
        return;
      }
      const initRes = await fetch("/api/upload/part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: f.name }),
      });
      if (!initRes.ok) {
        alert("Upload init failed");
        return;
      }
      const { uploadUrl, part } = await initRes.json();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": f.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: f,
      });
      setPartId(part.id);
      setFile(f);
    },
    []
  );

  useEffect(() => {
    async function analyze() {
      if (!partId) return;
      const res = await fetch("/api/dfm/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partId, material, tolerance }),
      });
      if (res.ok) {
        const data = await res.json();
        setHints(data.hints || []);
      }
    }
    analyze();
  }, [partId, material, tolerance]);

  const handleDrop = (files: FileList | null) => {
    const f = files?.[0];
    if (f) uploadAndAnalyze(f);
  };

  const generateQap = async () => {
    if (!partId) return;
    const res = await fetch("/api/qap/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partId,
        material,
        tolerance,
        certification,
        purpose,
      }),
    });
    if (res.ok) {
      const { qap_id, url } = await res.json();
      if (url) window.open(url, "_blank");
      router.push(`/qap/${qap_id}`);
    }
  };

  const goToQuote = () => {
    if (!partId) return;
    const params = new URLSearchParams({
      partId,
      material,
      tolerance,
      certification,
    });
    router.push(`/instant-quote?${params.toString()}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-end space-x-2">
        <button
          onClick={generateQap}
          disabled={!partId}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Generate QAP
        </button>
        <button
          onClick={goToQuote}
          disabled={!partId}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Create Instant Quote
        </button>
      </div>

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
          handleDrop(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          id="file-input"
          onChange={(e) => handleDrop(e.target.files)}
        />
        <label htmlFor="file-input" className="block cursor-pointer">
          <p className="text-gray-600">Drag & drop a CAD file or click to browse</p>
          <p className="text-xs text-gray-500 mt-2">
            STEP, IGES, STL, OBJ, DXF, SLDPRT
          </p>
        </label>
      </div>

      <CadViewer file={file} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Material</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="aluminum">Aluminum</option>
            <option value="steel">Steel</option>
            <option value="plastic">Plastic</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tolerance</label>
          <select
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="0.010">±0.010"</option>
            <option value="0.005">±0.005"</option>
            <option value="0.002">±0.002"</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Certification</label>
          <select
            value={certification}
            onChange={(e) => setCertification(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="ISO">ISO</option>
            <option value="AS9100">AS9100</option>
            <option value="ITAR">ITAR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            What is this part for?
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border rounded p-2"
            rows={3}
          />
        </div>
      </div>

      <DFMPanel hints={hints} />
    </div>
  );
}

