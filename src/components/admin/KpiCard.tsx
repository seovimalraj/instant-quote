interface KpiCardProps {
  title: string;
  value: string | number;
}

export default function KpiCard({ title, value }: KpiCardProps) {
  return (
    <div className="p-4 border rounded-md shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
