// Server-side proxy for pump.fun's metadata/image upload endpoint.
//
// pump.fun's /api/ipfs endpoint is internal to their own site — it isn't
// built for outside websites to call, and it doesn't return CORS headers
// permitting cross-origin browser requests. A request straight from
// stonkgen.fun's browser JS gets blocked by the browser before it ever
// reaches pump.fun ("Load failed" in Safari).
//
// Server-to-server requests aren't subject to CORS, so this function runs
// on Vercel's edge, forwards the upload to pump.fun on the server side,
// and hands the JSON response back to the browser as same-origin — no
// CORS problem on either hop.

export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const incomingFormData = await request.formData();

    const upstream = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: incomingFormData,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy failed: ' + (err && err.message ? err.message : String(err)) }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
}
