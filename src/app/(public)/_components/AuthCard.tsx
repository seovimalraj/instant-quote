import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  children: ReactNode;
}

export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-md border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-center text-2xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}
