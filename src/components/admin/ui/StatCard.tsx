import { type ElementType } from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: ElementType;
  trend?: { dir: 'up' | 'down'; value: string };
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      {Icon ? (
        <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="flex-1">
        <div className="text-sm text-slate-600">{title}</div>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
          {trend ? (
            <span className={trend.dir === 'up' ? 'text-emerald-600' : 'text-rose-600'}>
              {trend.dir === 'up' ? '▲' : '▼'} {trend.value}
            </span>
          ) : null}
          {subtext ? <span>{subtext}</span> : null}
        </div>
      </div>
    </div>
  );
}
