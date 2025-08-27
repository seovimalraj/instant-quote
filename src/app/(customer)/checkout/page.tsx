export const dynamic = 'force-dynamic'

export const runtime = 'nodejs';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const quoteId = typeof sp.quoteId === 'string' ? sp.quoteId : undefined;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = `/checkout${quoteId ? `?quoteId=${encodeURIComponent(quoteId)}` : ''}`;
    redirect(`/signin?next=${encodeURIComponent(next)}`);
  }

  // Minimal confirmation UI; call API to finalize the quote if needed
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
      {!quoteId ? (
        <p className="text-sm text-gray-600">Missing quoteId.</p>
      ) : (
        <form action={`/api/quotes/request`} method="post" className="space-y-3">
          <input type="hidden" name="quote_id" value={quoteId} />
          <p className="text-sm text-gray-700">You are about to request quote <strong>{quoteId}</strong>.</p>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Confirm & Request</button>
        </form>
      )}
    </div>
  );
}
