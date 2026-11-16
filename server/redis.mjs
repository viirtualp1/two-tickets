export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function redis(...command) {
  const { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token } = process.env;
  if (!url || !token) throw new ApiError(503, 'Sync is unavailable until Redis is configured.');

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(8000)
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new ApiError(503, 'Sync storage is temporarily unavailable.');
  return body.result;
}

export function post(handler, maxBytes = 950_000) {
  return {
    async fetch(request) {
      const headers = { 'Cache-Control': 'no-store' };
      try {
        if (request.method !== 'POST') throw new ApiError(405, 'Use POST.');
        const advertisedSize = Number(request.headers.get('content-length'));
        if (advertisedSize > maxBytes) throw new ApiError(413, 'This request is too large.');
        const buffer = await request.arrayBuffer();
        if (buffer.byteLength > maxBytes) throw new ApiError(413, 'This request is too large.');
        let body;
        try {
          body = JSON.parse(new TextDecoder().decode(buffer));
        } catch {
          throw new ApiError(400, 'Invalid JSON.');
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Invalid request.');
        return Response.json(await handler(body), { headers });
      } catch (error) {
        return Response.json({ error: error instanceof ApiError ? error.message : 'The service is temporarily unavailable.' },
          { headers, status: error instanceof ApiError ? error.status : 503 });
      }
    }
  };
}
