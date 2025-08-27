import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ComponentType } from 'react';

interface Trend {
  dir: 'up' | 'down';
  value: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: ComponentType<{ className?: string }>;
  trend?: Trend;
}

export default function StatCard({ title, value, subtext, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="p-4 border rounded-md shadow-sm space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-600">
          {Icon && <Icon className="h-5 w-5" />}
          <span className="text-sm">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center text-xs ${trend.dir === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.dir === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="ml-0.5">{trend.value}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtext && <div className="text-sm text-slate-500">{subtext}</div>}
    </div>
  );
}
