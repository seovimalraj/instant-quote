interface Props {
  label: string;
  value: number;
}

export default function BreakdownRow({ label, value }: Props) {
  return (
    <tr>
      <td className="py-1 capitalize">{label.replace(/_/g, " ")}</td>
      <td className="py-1 text-right">${value.toFixed(2)}</td>
    </tr>
  );
}
