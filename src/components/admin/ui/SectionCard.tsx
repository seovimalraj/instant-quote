import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function SectionCard({ title, children, actions }: SectionCardProps) {
  return (
    <div className="rounded-md border bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}
