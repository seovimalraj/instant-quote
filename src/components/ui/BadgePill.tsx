import { ReactNode } from "react";

interface BadgePillProps {
  children: ReactNode;
  variant?: "default" | "outline";
}

export default function BadgePill({ children, variant = "default" }: BadgePillProps) {
  const classes =
    variant === "outline"
      ? "border border-brand text-brand"
      : "bg-brand text-white";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
}
