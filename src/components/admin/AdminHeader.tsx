import { SignOutButton } from "@/components/auth/SignOutButton";

export default function AdminHeader() {
  return (
    <header className="card p-4 flex items-center justify-between">
      <div className="font-semibold">Control Panel</div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <div className="hidden sm:block">TailAdmin-like Shell</div>
        <div className="sm:hidden">
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
