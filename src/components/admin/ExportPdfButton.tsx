"use client";

interface Props {
  quoteId: string;
}

export default function ExportPdfButton({ quoteId }: Props) {
  const handleClick = () => {
    // Placeholder for actual PDF generation
    alert(`PDF export for quote ${quoteId} is not implemented yet.`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-4 py-2 bg-gray-200 rounded"
    >
      Export PDF
    </button>
  );
}

