import { ReactNode } from "react";
import Toolbar from "./Toolbar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Toolbar />
      <main className="container mx-auto flex-1 p-4">{children}</main>
    </div>
  );
}
