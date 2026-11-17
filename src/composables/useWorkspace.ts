import { computed, readonly, ref } from 'vue';

export type SharedValue = object | boolean | null;
export type SharedRecords = Record<string, SharedValue>;

interface Connection {
  room: string
  token: string
  owner: boolean
}

interface Workspace {
  records: SharedRecords
  base: SharedRecords
  version: number
  connection: Connection | null
  conflicts?: SharedRecords
}

const STORAGE_KEY = 'two-tickets:workspace:v1';
const empty: Workspace = { records: {}, base: {}, version: 0, connection: null };
const workspace = ref(readWorkspace());
const storageWarning = ref(false);
const connection = computed(() => workspace.value.connection);
const records = computed(() => workspace.value.records);

function readWorkspace (): Workspace {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const value = saved ? JSON.parse(saved) : null;
    return value?.records && value?.base && Number.isInteger(value.version) ? value : empty;
  } catch {
    return empty;
  }
}

function write (next: Workspace) {
  workspace.value = next;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    storageWarning.value = false;
  } catch {
    storageWarning.value = true;
  }
}

function current () {
  if (!storageWarning.value && localStorageAvailable()) {
    return readWorkspace();
  }

  return workspace.value;
}

function localStorageAvailable () {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && !storageWarning.value) {
    workspace.value = readWorkspace();
  }
});

function put (updates: SharedRecords) {
  const state = current();
  const conflicts = { ...state.conflicts };
  for (const key of Object.keys(updates)) {
    delete conflicts[key];
  }
  write({ ...state, records: { ...state.records, ...updates }, conflicts });
}

function connect (next: Connection, remote: SharedRecords = {}, version = 0, preferredLocal: SharedRecords = {}) {
  const state = current();
  const conflicts: SharedRecords = {};
  for (const [key, value] of Object.entries(preferredLocal)) {
    if (remote[key] !== undefined && !same(remote[key], value)) {
      conflicts[key] = value;
    }
  }
  write({ records: { ...state.records, ...remote }, base: remote, version, connection: next, conflicts });
}

function acceptServer (start: Workspace, version: number, remote: SharedRecords, rejected: SharedRecords) {
  const state = current();

  if (start.connection?.token !== state.connection?.token || version < state.version) {
    return;
  }

  // Keep anything edited while the request was in flight.
  const result = { ...remote };
  const conflicts = { ...state.conflicts, ...rejected };

  for (const key of Object.keys(state.records)) {
    if (!same(state.records[key], start.records[key])) {
      if (Object.hasOwn(rejected, key)) {
        conflicts[key] = state.records[key]!;
      } else {
        result[key] = state.records[key]!;
      }
    }
  }

  if (version !== state.version || !same(result, state.records) || !same(conflicts, state.conflicts ?? {})) {
    write({ ...state, records: result, base: remote, version, conflicts });
  }
}

export function same (left: SharedValue | undefined, right: SharedValue | undefined) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useWorkspace () {
  return {
    records, connection, storageWarning: readonly(storageWarning), current, put, connect, acceptServer,
    conflicts: computed(() => workspace.value.conflicts ?? {}),
    setConflicts: (state: Workspace, conflicts: SharedRecords) => write({ ...state, conflicts }),
    disconnect: () => write({ ...current(), base: {}, version: 0, connection: null, conflicts: {} })
  };
}
