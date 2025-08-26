import { NextRequest, NextResponse } from "next/server";
import { addDays, formatISO } from "date-fns";

// Provides upcoming available capacity dates for a machine.
export async function GET(req: NextRequest) {
  const machineId = req.nextUrl.searchParams.get("machineId");
  if (!machineId) {
    return NextResponse.json({ error: "machineId required" }, { status: 400 });
  }

  const today = new Date();
  const standard = Array.from({ length: 5 }, (_, i) =>
    formatISO(addDays(today, i + 3), { representation: "date" })
  );
  const expedite = Array.from({ length: 5 }, (_, i) =>
    formatISO(addDays(today, i + 1), { representation: "date" })
  );

  return NextResponse.json({ machineId, standard, expedite });
}

