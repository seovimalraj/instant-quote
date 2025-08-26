import { ReactNode } from "react";
import Toolbar from "./Toolbar";
import Link from "next/link";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toolbar>
        <Link href="/dfm">DFM Lab</Link>
        <Link href="/instant-quote">Instant Quote</Link>
      </Toolbar>
      <main className="container mx-auto flex-1 p-4">{children}</main>
    </div>
  );
}
