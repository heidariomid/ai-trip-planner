// Spec 16: deletes the signed-in traveller's own account. The app cannot do
// it, because removing a row from auth.users needs the secret key, and that
// key lives only here. The user id is read from the verified token and never
// from the request, so nobody can name someone else's account. Files go first
// and the user last: the database cascade then removes the profile, the trips,
// and every row that belongs to them.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const BUCKETS = ["images", "documents"];
const LIST_PAGE_SIZE = 100;
// A traveller's files sit at {user_id}/{folder}/{file}. One level deeper is
// allowed for, and nothing further is followed.
const MAX_DEPTH = 3;

const FAILED = "We couldn't delete your account. Nothing was removed. Try again.";
const HALF_DONE = "We couldn't finish deleting your account. Try again.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/**
 * Removes every file under a folder. A Storage list is one page and is not
 * recursive, so files are removed a page at a time and each folder is walked
 * in turn. Returns how many files went.
 */
async function emptyFolder(
  admin: SupabaseClient,
  bucket: string,
  folder: string,
  depth: number,
): Promise<number> {
  const storage = admin.storage.from(bucket);
  const folders: string[] = [];
  let removed = 0;
  let offset = 0;

  for (;;) {
    const { data: entries, error } = await storage.list(folder, {
      limit: LIST_PAGE_SIZE,
      offset,
    });
    if (error) throw error;
    if (entries.length === 0) break;

    // A folder comes back as an entry with no id.
    const files = entries.filter((entry) => entry.id !== null);
    for (const entry of entries) {
      if (entry.id === null) folders.push(`${folder}/${entry.name}`);
    }

    if (files.length > 0) {
      const paths = files.map((file) => `${folder}/${file.name}`);
      const { data: gone, error: removeError } = await storage.remove(paths);
      if (removeError) throw removeError;
      if (gone.length === 0) throw new Error(`no file removed under ${folder}`);
      removed += gone.length;
    }

    if (entries.length < LIST_PAGE_SIZE) break;
    // Removed files no longer take up a place in the list; folders still do.
    offset += entries.length - files.length;
  }

  if (depth < MAX_DEPTH) {
    for (const child of folders) {
      removed += await emptyFolder(admin, bucket, child, depth + 1);
    }
  }
  return removed;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  const apiKey = request.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!token || !apiKey || !supabaseUrl) return json(401, { error: "Sign in first." });

  const caller = createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authError } = await caller.auth.getUser(token);
  if (authError || !auth.user) return json(401, { error: "Sign in first." });
  const userId = auth.user.id;

  const secretKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secretKey) {
    console.error("[delete-account] the secret key is not set");
    return json(503, { error: FAILED });
  }
  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let removed = 0;
  try {
    for (const bucket of BUCKETS) {
      removed += await emptyFolder(admin, bucket, userId, 1);
    }
  } catch (error) {
    console.error("[delete-account] could not remove files", error);
    return json(500, { error: removed > 0 ? HALF_DONE : FAILED });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[delete-account] could not delete the user", deleteError);
    return json(500, { error: removed > 0 ? HALF_DONE : FAILED });
  }

  return json(200, { deleted: true });
});
