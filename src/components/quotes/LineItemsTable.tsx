import BreakdownRow from "./BreakdownRow";

interface Props {
  breakdown: Record<string, number>;
}

export default function LineItemsTable({ breakdown }: Props) {
  const entries = Object.entries(breakdown);
  return (
    <table className="w-full text-sm">
      <tbody>
        {entries.map(([k, v]) => (
          <BreakdownRow key={k} label={k} value={v} />
        ))}
      </tbody>
    </table>
  );
}
