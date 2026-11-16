import { post } from '../server/redis.mjs';
import { syncHandler } from '../server/sync.mjs';

export default post(syncHandler(), 2_000_000);
