import { requireAuth } from "@/lib/auth";
import { createClient as createServerClient } from "@/lib/supabase/server";
import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";

// Compat types: Next 15 may deliver params/searchParams as Promises
type Params = Record<string, string>;
type SearchParams = Record<string, string | string[] | undefined>;
export default async function Page(props: {
  params?: any;
  searchParams?: any;
}) {
  await requireAuth();

  // Resolve async/sync params & searchParams without relying on Next type exports
  const params: Params = (await props?.params) ?? {};
  const searchParams: SearchParams = (await props?.searchParams) ?? {};

  const partId =
    typeof searchParams.partId === "string" ? searchParams.partId : undefined;
  const defaultMaterialId =
    typeof searchParams.materialId === "string"
      ? searchParams.materialId
      : undefined;
  const defaultToleranceId =
    typeof searchParams.toleranceId === "string"
      ? searchParams.toleranceId
      : undefined;
  const purpose =
    typeof searchParams.purpose === "string" ? searchParams.purpose : undefined;

  void params; // silence unused for now

  // If you need server-side data for the form, fetch here with the server client
  // const supabase = createServerClient();
  // const { data: materials } = await supabase.from('materials').select('*').eq('is_active', true);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Instant Quote</h1>
      {partId ? (
        <InstantQuoteForm
          partId={partId}
          defaultMaterialId={defaultMaterialId}
          defaultToleranceId={defaultToleranceId}
          purpose={purpose}
        />
      ) : (
        <p className="text-sm text-gray-500">No part selected.</p>
      )}
    </div>
  );
}
