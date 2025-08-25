import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a signed upload URL for the `parts` bucket.
 * URLs expire automatically after a short time (Supabase default).
 * @param client Supabase client (server-side)
 * @param path   Object path within the bucket
 */
export async function createSignedUploadUrl(
  client: SupabaseClient,
  path: string,
) {
  const { data, error } = await client.storage
    .from("parts")
    .createSignedUploadUrl(path);
  if (error) {
    throw error;
  }
  return data;
}
