import { computed, ref } from 'vue';
import { PREP } from '../data/trip';
import { legacyPrep } from './useProgress';
import { ORIGINAL_ID, newId } from '../lib/plan';
import { useWorkspace } from './useWorkspace';
import type { SharedRecords } from './useWorkspace';

export interface ChecklistDraft {
  title: string
  why: string
  reminderAt: string | null
}

export interface ChecklistItem extends ChecklistDraft {
  id: string
  done: boolean
  notified: boolean
  dismissed: boolean
}

const { records, put, storageWarning } = useWorkspace();
const reminderFlags = ref<Record<string, boolean>>(readJSON('two-tickets:reminders:v1', {}));

function readJSON<T> (key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

const migrated = readJSON<ChecklistItem[]>('two-tickets:checklist:v1', PREP.map(item => ({
  ...item, done: legacyPrep[item.id] === true, reminderAt: null, notified: false, dismissed: false
})));
const initial: SharedRecords = {};
const legacyItems = new Map((Array.isArray(migrated) ? migrated : []).filter(item => item && typeof item.id === 'string')
  .map(item => [item.id, item]));
for (const id of new Set([...PREP.map(item => item.id), ...legacyItems.keys()])) {
  const key = `todo:${ORIGINAL_ID}:${id}`;
  if (records.value[key] !== undefined) {
    continue;
  }
  const item = legacyItems.get(id);
  if (!item) {
    initial[key] = null;
  } else {
    const { notified, dismissed, ...shared } = item;
    initial[key] = shared;
    if (notified) {
      reminderFlags.value[flagKey(key, item.reminderAt, 'notified')] = true;
    }
    if (dismissed) {
      reminderFlags.value[flagKey(key, item.reminderAt, 'dismissed')] = true;
    }
  }
}
if (Object.keys(initial).length) {
  put(initial);
  saveFlags();
}

function flagKey (key: string, at: string | null, status: string) {
  return `${key}:${at}:${status}`;
}

function saveFlags () {
  try {
    localStorage.setItem('two-tickets:reminders:v1', JSON.stringify(reminderFlags.value));
  } catch {
    // Session only.
  }
}

export function useChecklist (tripId: () => string = () => ORIGINAL_ID) {
  const prefix = computed(() => `todo:${tripId()}:`);
  const items = computed(() => Object.entries(records.value)
    .filter(([key, value]) => key.startsWith(prefix.value) && value)
    .map(([key, value]): ChecklistItem => {
      const item = value as Omit<ChecklistItem, 'notified' | 'dismissed'>;
      return {
        ...item,
        notified: Boolean(reminderFlags.value[flagKey(key, item.reminderAt, 'notified')]),
        dismissed: Boolean(reminderFlags.value[flagKey(key, item.reminderAt, 'dismissed')])
      };
    }));

  function save (id: string | null, draft: ChecklistDraft) {
    const key = prefix.value + (id ?? newId());
    const item = records.value[key] as ChecklistItem | null | undefined;
    if (id && !item) {
      return false;
    }
    put({ [key]: { ...draft, id: key.slice(prefix.value.length), done: item?.done ?? false } });
    return true;
  }
  function remove (id: string) {
    put({ [prefix.value + id]: null });
  }
  function toggle (id: string) {
    const key = prefix.value + id;
    const item = records.value[key] as ChecklistItem | null | undefined;
    if (item) {
      put({ [key]: { ...item, done: !item.done } });
    }
  }
  function markReminder (id: string, at: string, status: 'notified' | 'dismissed') {
    const item = records.value[prefix.value + id] as ChecklistItem | null | undefined;
    if (item?.reminderAt !== at || item.done) {
      return;
    }
    reminderFlags.value[flagKey(prefix.value + id, at, status)] = true;
    saveFlags();
  }
  return { items, storageWarning, save, remove, toggle, markReminder };
}
