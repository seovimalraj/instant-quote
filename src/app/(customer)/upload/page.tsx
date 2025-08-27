export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import PartDropzone from "@/components/upload/PartDropzone";

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-6">Upload a part</h1>
      <PartDropzone />
    </div>
  );
}

