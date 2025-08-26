"use client";

import InstantQuoteForm from '@/components/quotes/InstantQuoteForm';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export default function InstantQuotePage() {
  const params = useSearchParams();
  const partName = params.get('part') ?? '';
  return (
    <div className="p-4">
      <Suspense fallback={<p>Loading...</p>}>
        <InstantQuoteForm partId="demo" prefill={{ partName }} />
      </Suspense>
    </div>
  );
}
