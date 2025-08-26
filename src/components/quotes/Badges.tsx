"use client";

interface Props {
  processKind?: string;
  leadTime?: "standard" | "expedite";
  certifications?: string[];
  tolerance?: string;
}

const processLabels: Record<string, string> = {
  cnc_milling: "CNC Milling",
  cnc_turning: "CNC Turning",
  sheet_metal: "Sheet Metal",
  "3dp_fdm": "FDM 3D Printing",
  "3dp_sla": "SLA 3D Printing",
  "3dp_sls": "SLS 3D Printing",
  injection_proto: "Injection Prototype",
};

const leadLabels: Record<string, string> = {
  standard: "Standard",
  expedite: "Expedite",
};

export default function Badges({ processKind, leadTime, certifications, tolerance }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {processKind && (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
          {processLabels[processKind] || processKind}
        </span>
      )}
      {leadTime && (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
          {leadLabels[leadTime] || leadTime}
        </span>
      )}
      {tolerance && (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
          {tolerance}
        </span>
      )}
      {certifications?.map((code) => (
        <span
          key={code}
          className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium"
        >
          {code}
        </span>
      ))}
    </div>
  );
}

