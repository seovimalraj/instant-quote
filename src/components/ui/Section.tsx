import { ReactNode } from "react";

interface SectionProps {
  title?: string;
  children: ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-8">
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      <div className="rounded-md border bg-white p-4">{children}</div>
    </section>
  );
}
