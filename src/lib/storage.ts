import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a signed upload URL for the `parts` bucket.
 * @param client Supabase client (server-side)
 * @param path   Object path within the bucket
 */
export async function createSignedUploadUrl(
  client: SupabaseClient,
  path: string,
) {
  const { data, error } = await client.storage
    .from("parts")
    .createSignedUploadUrl(path, { upsert: true });
  if (error) {
    throw error;
  }
  return data;
}

/** Upload a file to the `parts` bucket on the server. */
export async function uploadToParts(
  client: SupabaseClient,
  path: string,
  file: ArrayBuffer | Blob,
  contentType?: string,
) {
  const inferredType = contentType ?? (file instanceof Blob ? file.type : undefined);
  const { data, error } = await client.storage
    .from("parts")
    .upload(path, file, { upsert: true, contentType: inferredType });
  if (error) {
    throw error;
  }
  return data;
}
