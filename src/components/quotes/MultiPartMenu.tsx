"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Tier {
  quantity: number;
  price: number;
}

interface Part {
  id: string;
  name: string;
  price?: number;
  tiers?: Tier[];
}

interface MultiPartMenuProps {
  parts: Part[];
  currentPartId?: string;
  onSelectPart?: (id: string) => void;
  onAddPart?: () => void;
  onRemovePart?: (id: string) => void;
}

export default function MultiPartMenu({
  parts,
  currentPartId,
  onSelectPart,
  onAddPart,
  onRemovePart,
}: MultiPartMenuProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(currentPartId);

  useEffect(() => {
    setSelectedId(currentPartId);
  }, [currentPartId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectPart?.(id);
  };

  const selected = parts.find((p) => p.id === selectedId);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">Parts</span>
        {onAddPart && (
          <button
            onClick={onAddPart}
            className="flex items-center text-sm text-blue-600"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Part
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {parts.map((part) => (
          <li
            key={part.id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer ${
              selectedId === part.id ? "bg-gray-200" : "hover:bg-gray-100"
            }`}
            onClick={() => handleSelect(part.id)}
          >
            <span>{part.name}</span>
            <span className="flex items-center space-x-2">
              {typeof part.price !== "undefined" && (
                <span className="text-sm">${part.price.toFixed(2)}</span>
              )}
              {onRemovePart && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePart(part.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-4 space-y-1 text-sm">
          {typeof selected.price !== "undefined" && (
            <div>Price: ${selected.price.toFixed(2)}</div>
          )}
          {selected.tiers && selected.tiers.length > 0 && (
            <div>
              <div className="font-medium">Quantity Tiers</div>
              <ul className="list-disc ml-4">
                {selected.tiers.map((t) => (
                  <li key={t.quantity}>
                    {t.quantity}+ : ${t.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

