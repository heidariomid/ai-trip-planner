// Spec 17: keeps the free Supabase project awake. Vercel calls this once a
// day (the schedule is in vercel.json), and it asks the database for the time
// with the publishable key, the same key the site already ships.

export async function GET() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return Response.json({ ok: false, error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const answer = await fetch(`${url}/rest/v1/rpc/ping`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!answer.ok) {
      console.error("[keep-alive] the database answered", answer.status);
      return Response.json({ ok: false, status: answer.status }, { status: 502 });
    }
    return Response.json({ ok: true, at: await answer.json() });
  } catch (error) {
    console.error("[keep-alive] the request failed", error);
    return Response.json({ ok: false }, { status: 502 });
  }
}
