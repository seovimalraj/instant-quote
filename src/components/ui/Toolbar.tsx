import Link from "next/link";
import { ReactNode } from "react";
import Brand from "./Brand";

interface ToolbarProps {
  children?: ReactNode;
}

export default function Toolbar({ children }: ToolbarProps) {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4">{children}</nav>
      </div>
    </header>
  );
}
