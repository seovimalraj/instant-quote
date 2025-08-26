import DynamicForm from "@/components/forms/DynamicForm";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { formId: string };
}

export default async function FormPage({ params }: Props) {
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("custom_forms")
    .select("id,name,description,schema")
    .eq("id", params.formId)
    .single();

  async function submit(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const entries = Object.fromEntries(formData.entries());
    await supabase.from("custom_form_responses").insert({
      form_id: params.formId,
      respondent_id: user?.id,
      data: entries,
    });
  }

  if (!form) {
    return <div className="p-10">Form not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-2">{form.name}</h1>
      {form.description && (
        <p className="text-sm text-gray-500 mb-4">{form.description}</p>
      )}
      <DynamicForm schema={form.schema} action={submit} />
    </div>
  );
}

