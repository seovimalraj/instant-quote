import DataTable from "@/components/admin/DataTable";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Field } from "@/types/forms";

export default async function CertificationsPage() {
  await requireAdmin();
  return <ClientPage />;
}

function ClientPage() {
  "use client";

  const [vendors, setVendors] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [{ data: v }, { data: c }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name")
          .eq("role", "vendor")
          .order("full_name"),
        supabase.from("certifications").select("id,name").order("name"),
      ]);
      setVendors(v || []);
      setCerts(c || []);
    };
    load();
  }, []);

  const certSchema = z.object({
    name: z.string().min(1),
    is_active: z.boolean().optional(),
  });
  const certColumns = [{ accessorKey: "name", header: "Name" }];
  const certFields: Field[] = [
    { name: "name", label: "Name", type: "text" },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  const vendorCertSchema = z.object({
    vendor_id: z.string().uuid(),
    certification_id: z.string().uuid(),
    is_active: z.boolean().optional(),
  });
  const vendorCertColumns = [
    {
      accessorKey: "vendor_id",
      header: "Vendor",
      cell: ({ row }: any) =>
        row.original.profiles?.full_name || row.original.vendor_id,
    },
    {
      accessorKey: "certification_id",
      header: "Certification",
      cell: ({ row }: any) =>
        row.original.certifications?.name || row.original.certification_id,
    },
  ];
  const vendorCertFields: Field[] = [
    {
      name: "vendor_id",
      label: "Vendor",
      type: "select",
      options: vendors.map((v) => ({
        value: v.id as string,
        label: v.full_name as string,
      })),
    },
    {
      name: "certification_id",
      label: "Certification",
      type: "select",
      options: certs.map((c) => ({
        value: c.id as string,
        label: c.name as string,
      })),
    },
    { name: "is_active", label: "Active", type: "checkbox" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Certifications</h1>
        <DataTable
          endpoint="/api/certifications"
          columns={certColumns}
          schema={certSchema}
          fields={certFields}
          filterKey="name"
          idInQuery
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">Vendor Certifications</h2>
        <DataTable
          endpoint="/api/vendor-certifications"
          columns={vendorCertColumns}
          schema={vendorCertSchema}
          fields={vendorCertFields}
          filterKey="profiles.full_name"
          idInQuery
        />
      </div>
    </div>
  );
}

