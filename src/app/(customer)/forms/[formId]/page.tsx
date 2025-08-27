export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = "nodejs";
import { requireAuth } from '@/lib/auth';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Next 15 may deliver `params` as a Promise; support both sync/async without importing Next types
type Params = { formId: string };

export default async function Page(props: { params: any }) {
  await requireAuth();
  const { formId } = (await props.params) as Params;

  const supabase = await createServerClient();
  const { data: form } = await supabase
    .from('custom_forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (!form) {
    return <div className="p-6">Form not found.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{form.name}</h1>
      {/* TODO: render DynamicForm here with the form.schema */}
    </div>
  );
}
