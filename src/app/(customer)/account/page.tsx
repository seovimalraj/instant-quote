export const runtime = "nodejs";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-10">Please log in.</div>;
  }

  const [{ data: profile }, { data: customer }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("customers").select("*").eq("owner_id", user.id).single(),
  ]);

  const address: any = customer?.shipping_address || {};

  async function updateProfile(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name"),
        phone: formData.get("phone"),
      })
      .eq("id", user?.id);
  }

  async function updateCompany(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: cust } = await supabase
      .from("customers")
      .select("id")
      .eq("owner_id", user?.id)
      .single();
    if (cust) {
      await supabase
        .from("customers")
        .update({
          name: formData.get("name"),
          website: formData.get("website"),
        })
        .eq("id", cust.id);
    }
  }

  async function updateAddress(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: cust } = await supabase
      .from("customers")
      .select("id")
      .eq("owner_id", user?.id)
      .single();
    if (cust) {
      const addr = {
        street: formData.get("street"),
        city: formData.get("city"),
        state: formData.get("state"),
        postal_code: formData.get("postal_code"),
        country: formData.get("country"),
      };
      await supabase
        .from("customers")
        .update({ shipping_address: addr })
        .eq("id", cust.id);
    }
  }

  async function updatePrefs(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("profiles")
      .update({ region: formData.get("region") })
      .eq("id", user?.id);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10">
      <h1 className="text-2xl font-semibold">Account</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Profile</h2>
        <form action={updateProfile} className="space-y-2">
          <input
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            placeholder="Full name"
            className="border p-2 rounded w-full"
          />
          <input
            name="phone"
            defaultValue={profile?.phone ?? ""}
            placeholder="Phone"
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Company</h2>
        <form action={updateCompany} className="space-y-2">
          <input
            name="name"
            defaultValue={customer?.name ?? ""}
            placeholder="Company name"
            className="border p-2 rounded w-full"
          />
          <input
            name="website"
            defaultValue={customer?.website ?? ""}
            placeholder="Website"
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Address</h2>
        <form action={updateAddress} className="space-y-2">
          <input
            name="street"
            defaultValue={address.street ?? ""}
            placeholder="Street"
            className="border p-2 rounded w-full"
          />
          <input
            name="city"
            defaultValue={address.city ?? ""}
            placeholder="City"
            className="border p-2 rounded w-full"
          />
          <input
            name="state"
            defaultValue={address.state ?? ""}
            placeholder="State"
            className="border p-2 rounded w-full"
          />
          <input
            name="postal_code"
            defaultValue={address.postal_code ?? ""}
            placeholder="Postal code"
            className="border p-2 rounded w-full"
          />
          <input
            name="country"
            defaultValue={address.country ?? ""}
            placeholder="Country"
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Preferences</h2>
        <form action={updatePrefs} className="space-y-2">
          <input
            name="region"
            defaultValue={profile?.region ?? ""}
            placeholder="Region"
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
            Save
          </button>
        </form>
      </section>
    </div>
  );
}

