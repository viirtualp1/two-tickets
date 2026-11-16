import { createHash, randomBytes } from 'node:crypto';
import { ApiError, redis } from './redis.mjs';
import { requireSetupCode } from './setup.mjs';

const CAS = "if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET', KEYS[1], ARGV[2]); return 1";
const roomPattern = /^[a-f0-9]{32}$/;
const secretPattern = /^[a-f0-9]{64}$/;
const recordKey = /^(plan:[a-f0-9]{32}|(todo|visit):[\w-]+:[\w-]+)$/;
const secret = () => randomBytes(32).toString('hex');
const digest = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function validRecords (records) {
  return records && typeof records === 'object' && !Array.isArray(records)
    && Object.entries(records).every(([key, value]) => recordKey.test(key)
      && (value === null || (key.startsWith('visit:') ? typeof value === 'boolean' : typeof value === 'object' && !Array.isArray(value))));
}

function validPatch (patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return false;
  return Object.entries(patch).every(([key, change]) => Array.isArray(change) && change.length === 2
    && validRecords({ [key]: change[0] }) && validRecords({ [key]: change[1] }));
}

function snapshot (state, conflicts = {}) {
  return { records: state.records, version: state.version, conflicts, paired: Boolean(state.guest) };
}

export function syncHandler (command = redis) {
  return async function sync (input) {
    const { room, token, action } = input;
    if (typeof room !== 'string' || !roomPattern.test(room) || typeof token !== 'string' || !secretPattern.test(token)) {
      throw new ApiError(400, 'Invalid pairing details.');
    }

    const key = `two-tickets:room:${room}`;
    const credential = digest(token);

    if (action === 'create') {
      requireSetupCode(input.code);
      const state = { owner: credential, guest: null, invite: null, records: {}, version: 0 };
      await command('SET', key, JSON.stringify(state), 'NX');
    }

    for (let attempt = 0; attempt < 8; attempt++) {
      const raw = await command('GET', key);
      if (!raw) throw new ApiError(404, 'This pairing link is invalid.');
      const state = JSON.parse(raw);
      const owner = state.owner === credential;
      const guest = state.guest === credential;

      if (action === 'join') {
        if (guest) return snapshot(state);
        if (state.guest || !state.invite || state.invite.expires < Date.now()
          || typeof input.invite !== 'string' || !secretPattern.test(input.invite) || digest(input.invite) !== state.invite.hash) {
          throw new ApiError(403, 'This pairing link has expired or has already been used.');
        }
        state.guest = credential;
        state.invite = null;
      } else if (!owner && !guest) {
        throw new ApiError(401, 'This device is no longer paired.');
      } else if (action === 'create') {
        return snapshot(state);
      } else if (action === 'invite') {
        if (!owner || state.guest) throw new ApiError(409, 'This workspace already has two devices.');
        const invite = secret();
        state.invite = { hash: digest(invite), expires: Date.now() + 15 * 60_000 };
        if (await command('EVAL', CAS, 1, key, raw, JSON.stringify(state))) return { invite };
        continue;
      } else if (action === 'revoke' || action === 'leave') {
        if ((action === 'revoke' && !owner) || (action === 'leave' && !guest)) {
          throw new ApiError(403, 'This device cannot perform that action.');
        }
        state.guest = null;
        state.invite = null;
      } else if (action === 'sync') {
        if (!validPatch(input.patch)) throw new ApiError(400, 'Invalid changes.');
        const conflicts = {};
        let changed = false;

        for (const [id, [base, next]] of Object.entries(input.patch)) {
          const remote = state.records[id] ?? null;
          if (equal(remote, next)) continue;
          if (!equal(remote, base)) {
            conflicts[id] = remote;
            continue;
          }
          state.records[id] = next;
          changed = true;
        }

        if (!changed) return snapshot(state, conflicts);
        state.version++;
        const serialized = JSON.stringify(state);
        if (Buffer.byteLength(serialized) > 750_000) throw new ApiError(413, 'This shared workspace is full.');
        if (await command('EVAL', CAS, 1, key, raw, serialized)) return snapshot(state, conflicts);
        continue;
      } else {
        throw new ApiError(400, 'Unknown sync action.');
      }

      if (await command('EVAL', CAS, 1, key, raw, JSON.stringify(state))) return snapshot(state);
    }

    throw new ApiError(409, 'The other device is syncing. Try again.');
  };
}
