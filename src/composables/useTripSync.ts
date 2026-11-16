import { ref, watch } from 'vue';
import { newId, ORIGINAL_ID } from '../lib/plan';
import { PREP } from '../data/trip';
import { same, useWorkspace } from './useWorkspace';
import type { SharedRecords } from './useWorkspace';

const { current, connection, records, connect, acceptServer, put } = useWorkspace();
const status = ref('Local only');
const paired = ref(false);
const { conflicts, setConflicts } = useWorkspace();
let running: Promise<void> | null = null;
let scheduled: number | undefined;
let started = false;
let pendingOwner: { room: string; token: string; owner: true } | undefined;
const joiningTokens = new Map<string, string>();

class SyncError extends Error {
  constructor (message: string, readonly status: number) {
    super(message);
  }
}

async function request<T> (body: object): Promise<T> {
  const response = await fetch(new URL('api/sync', document.baseURI), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new SyncError(result?.error ?? 'The server is unavailable.', response.status);
  return result as T;
}

interface Snapshot {
  records: SharedRecords;
  version: number;
  paired: boolean;
  conflicts: SharedRecords;
}

function sync () {
  if (!connection.value || running) return running;

  const start = current();
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(start.records)) {
    const previous = start.base[key] ?? null;
    if (!same(previous, value)) patch[key] = [previous, value];
  }
  status.value = 'Syncing…';
  running = (async () => {
    try {
      const result = await request<Snapshot>({ ...start.connection, action: 'sync', patch });
      const rejected: SharedRecords = {};
      for (const key of Object.keys(result.conflicts)) {
        rejected[key] = start.records[key] ?? null;
      }
      acceptServer(start, result.version, result.records, rejected);
      paired.value = result.paired;
      status.value = 'Up to date';
    } catch (error) {
      status.value = navigator.onLine ? (error as Error).message : 'Offline. Changes are saved on this device.';
    } finally {
      running = null;
    }
  })();
  return running;
}

function schedule () {
  clearTimeout(scheduled);
  scheduled = window.setTimeout(() => void sync(), 500);
}

export function startTripSync () {
  if (started) return;
  started = true;
  watch(records, schedule);
  window.addEventListener('online', schedule);
  window.addEventListener('focus', schedule);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  window.setInterval(() => { if (!document.hidden) void sync(); }, 15_000);
  void sync();
}

function keepMine () {
  put(conflicts.value);
}

function clearConflicts () {
  setConflicts(current(), {});
}

export function useTripSync () {
  async function invite (code: string) {
    let credential = current().connection;
    if (!credential) {
      pendingOwner ??= { room: newId(), token: newId() + newId(), owner: true };
      credential = pendingOwner;
      await request({ ...credential, action: 'create', code });
      connect(credential);
      pendingOwner = undefined;
    }
    await sync();
    const result = await request<{ invite: string }>({ ...credential, action: 'invite' });
    const link = new URL(location.href);
    link.search = '';
    link.hash = `/sync?room=${credential.room}&invite=${result.invite}`;
    return link.href;
  }

  async function join (room: string, invite: string) {
    if (connection.value) throw new Error('Disconnect this device before joining another workspace.');
    const token = joiningTokens.get(room) ?? newId() + newId();
    joiningTokens.set(room, token);
    const credential = { room, token, owner: false };
    const remote = await request<Snapshot>({ ...credential, action: 'join', invite });
    const defaults = Object.fromEntries(PREP.map(item => [`todo:${ORIGINAL_ID}:${item.id}`, { ...item, reminderAt: null, done: false }]));
    const preferred = Object.fromEntries(Object.entries(current().records)
      .filter(([key, value]) => !same(defaults[key], value)));
    connect(credential, remote.records, remote.version, preferred);
    joiningTokens.delete(room);
    await sync();
  }

  async function disconnect () {
    await running;
    try {
      await request({ ...current().connection, action: 'leave' });
    } catch (error) {
      if (!(error instanceof SyncError) || ![401, 404].includes(error.status)) throw error;
    }
    useWorkspace().disconnect();
    paired.value = false;
    status.value = 'Local only';
  }

  async function revoke () {
    await running;
    await request({ ...current().connection, action: 'revoke' });
    paired.value = false;
  }

  return { status, paired, conflicts, connection, invite, join, sync, revoke, disconnect, keepMine, clearConflicts };
}
