import { createHash, timingSafeEqual } from 'node:crypto';
import { ApiError } from './redis.mjs';

export function requireSetupCode (code) {
  const expected = process.env.TRIP_SETUP_CODE;
  if (!expected) throw new ApiError(503, 'Set TRIP_SETUP_CODE on the server to enable this action.');
  const hash = value => createHash('sha256').update(value).digest();
  if (typeof code !== 'string' || !timingSafeEqual(hash(code), hash(expected))) {
    throw new ApiError(403, 'The setup code was not accepted.');
  }
}
