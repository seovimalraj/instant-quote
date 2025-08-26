import { ReactNode, createContext, useContext, useState } from "react";
import Toolbar from "./Toolbar";
import BreakdownRow, {
  BreakdownLine,
  formatCurrency,
} from "../quotes/BreakdownRow";

interface BreakdownJson {
  lines: BreakdownLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

interface PriceExplainerPayload {
  breakdown: BreakdownJson;
  processKind: string;
  leadTime: string;
}

const PriceExplainerContext = createContext<{
  show: (p: PriceExplainerPayload) => void;
  hide: () => void;
} | null>(null);

export function usePriceExplainer() {
  const ctx = useContext(PriceExplainerContext);
  if (!ctx) throw new Error("usePriceExplainer must be used within AppShell");
  return ctx;
}

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [payload, setPayload] = useState<PriceExplainerPayload | null>(null);
  const show = (p: PriceExplainerPayload) => setPayload(p);
  const hide = () => setPayload(null);

  return (
    <PriceExplainerContext.Provider value={{ show, hide }}>
      <div className="flex min-h-screen flex-col bg-neutral-50 text-slate-900">
        <Toolbar />
        <main className="container mx-auto flex-1 p-4">{children}</main>
        {payload && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-1">Price Breakdown</h2>
              <p className="text-xs text-gray-500 mb-4">
                {payload.processKind} · {payload.leadTime === "expedite" ? "Expedited" : "Standard"}
              </p>
              <table className="w-full mb-4">
                <tbody>
                  {payload.breakdown.lines.map((line) => (
                    <BreakdownRow
                      key={line.label}
                      line={line}
                      currency={payload.breakdown.currency as any}
                    />
                  ))}
                  <tr className="text-sm font-medium border-t">
                    <td className="py-1 pr-4">Total</td>
                    <td className="py-1 text-right">
                      {formatCurrency(payload.breakdown.total, payload.breakdown.currency as any)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="text-right">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={hide}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PriceExplainerContext.Provider>
  );
}
