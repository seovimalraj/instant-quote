import Link from 'next/link';
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold">Frigate</Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/instant-quote" className="link">Instant Quote</Link>
            <Link href="/parts" className="link">My Parts</Link>
            <Link href="/orders" className="btn">Orders</Link>
            <Link href="/signin" className="btn btn-primary">Sign in</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6">{children}</main>
      <footer className="py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} Frigate</footer>
    </div>
  );
}
