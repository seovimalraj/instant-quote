"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  FileText,
  LayoutDashboard,
  Package,
  ShoppingCart,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/machines", label: "Machines", icon: Cpu },
  { href: "/admin/materials", label: "Materials", icon: Package },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:block col-span-3 lg:col-span-2 p-4 space-y-4 bg-white border-r">
      <div className="text-lg font-semibold">Admin</div>
      <nav>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${pathname?.startsWith(href) ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'}`}
                aria-current={pathname?.startsWith(href) ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
