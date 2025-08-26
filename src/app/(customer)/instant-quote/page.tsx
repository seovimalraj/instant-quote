export const runtime = "nodejs";
import { requireAuth } from "@/lib/auth";
import InstantQuoteClient from "./InstantQuoteClient";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;
  return <InstantQuoteClient searchParams={sp} />;
}

