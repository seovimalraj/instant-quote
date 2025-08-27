import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-12">
      <AdminSidebar />
      <main className="col-span-12 md:col-span-9 lg:col-span-10 p-4 md:p-6 space-y-4">
        <AdminHeader />
        <section>{children}</section>
      </main>
    </div>
  );
}
