import InstantQuoteForm from "@/components/quotes/InstantQuoteForm";

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function InstantQuotePage({ searchParams }: Props) {
  const partId = typeof searchParams.partId === "string" ? searchParams.partId : undefined;
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Instant Quote</h1>
      {partId ? (
        <InstantQuoteForm partId={partId} />
      ) : (
        <p className="text-sm text-gray-500">No part selected.</p>
      )}
    </div>
  );
}

