'use client';

export default function AdminHeader() {
  return (
    <header className="card p-4 flex items-center justify-between">
      <div className="font-semibold">Control Panel</div>
      <div className="text-sm text-slate-600 hidden sm:block">TailAdmin-like Shell</div>
    </header>
  );
}
