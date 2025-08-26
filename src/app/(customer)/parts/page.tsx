import { createClient } from "@/lib/supabase/server";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

const PAGE_SIZE = 10;

export default async function PartsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-10">Please log in.</div>;
  }

  const page = Number(searchParams.page ?? "1");
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("parts")
    .select("id,file_name,preview_url,created_at", { count: "exact" })
    .eq("owner_id", user.id);

  if (q) {
    query = query.ilike("file_name", `%${q}%`);
  }

  const { data: partsData, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const parts = await Promise.all(
    (partsData ?? []).map(async (p) => {
      let preview: string | null = null;
      if (p.preview_url) {
        const { data } = await supabase
          .storage
          .from("parts")
          .createSignedUrl(p.preview_url, 3600);
        preview = data?.signedUrl ?? null;
      }
      return { ...p, preview };
    })
  );

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Parts</h1>

      <form className="mb-4 flex space-x-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search"
          className="border p-2 rounded flex-1"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Filter
        </button>
      </form>

      <ul className="grid grid-cols-2 gap-4">
        {parts.map((p) => (
          <li key={p.id} className="border rounded p-2">
            {p.preview && (
              <img
                src={p.preview}
                alt={p.file_name}
                className="w-full h-32 object-contain mb-2"
              />
            )}
            <p className="text-sm">{p.file_name}</p>
          </li>
        ))}
        {!parts.length && (
          <li className="text-sm text-gray-500">No parts found</li>
        )}
      </ul>

      <div className="mt-4 flex justify-between">
        {page > 1 && (
          <a
            href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}
            className="text-blue-600"
          >
            Previous
          </a>
        )}
        {page < totalPages && (
          <a
            href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}
            className="ml-auto text-blue-600"
          >
            Next
          </a>
        )}
      </div>
    </div>
  );
}

