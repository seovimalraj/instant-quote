export interface QapInput {
  partId: string;
  material: string;
  tolerance: string;
  certification: string;
  purpose: string;
}

export interface QapData {
  ctqs: string[];
  inspection_methods: string[];
  sampling_plan: string;
  material_certs: string[];
  process_controls: string[];
  html: string;
}

export async function generateQap(input: QapInput): Promise<QapData> {
  const ctqs = ["Overall length", "Hole diameter", "Surface finish"];
  const inspection_methods = ["CMM", "Calipers", "Visual"];
  const sampling_plan = input.certification === "AS9100" ? "AQL 0.65" : "AQL 1.0";
  const material_certs = [input.certification];
  const process_controls = [
    "First article inspection",
    "In-process SPC",
    "Final inspection",
  ];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>QAP</title></head><body><h1>Quality Assurance Plan</h1><h2>CTQs</h2><ul>${ctqs
    .map((c) => `<li>${c}</li>`)
    .join("")}</ul><h2>Inspection Methods</h2><ul>${inspection_methods
    .map((m) => `<li>${m}</li>`)
    .join("")}</ul><h2>Sampling</h2><p>${sampling_plan}</p><h2>Material Certifications</h2><ul>${material_certs
    .map((c) => `<li>${c}</li>`)
    .join("")}</ul><h2>Process Controls</h2><ul>${process_controls
    .map((c) => `<li>${c}</li>`)
    .join("")}</ul></body></html>`;

  return {
    ctqs,
    inspection_methods,
    sampling_plan,
    material_certs,
    process_controls,
    html,
  };
}
