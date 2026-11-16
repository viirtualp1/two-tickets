import { ApiError } from '../server/redis.mjs';
import { extractTrip } from '../server/import.mjs';

export default {
  async fetch(request) {
    const headers = { 'Cache-Control': 'no-store' };
    try {
      if (request.method !== 'POST') throw new ApiError(405, 'Use POST.');
      return Response.json(await extractTrip(request), { headers });
    } catch (error) {
      return Response.json({ error: error instanceof ApiError ? error.message : 'The file could not be analyzed.' },
        { headers, status: error instanceof ApiError ? error.status : 503 });
    }
  }
};
