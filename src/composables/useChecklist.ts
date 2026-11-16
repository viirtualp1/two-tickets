import { readonly, ref } from 'vue';
import { PREP } from '../data/trip';
import { useProgress } from './useProgress';

export interface ChecklistDraft {
  title: string;
  why: string;
  reminderAt: string | null;
}

export interface ChecklistItem extends ChecklistDraft {
  id: string;
  done: boolean;
  notified: boolean;
  dismissed: boolean;
}

const STORAGE_KEY = 'two-tickets:checklist:v1';
const items = ref<ChecklistItem[]>([]);
const storageWarning = ref(false);
let loaded = false;

function isItem (value: unknown): value is ChecklistItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as Partial<ChecklistItem>;

  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.why === 'string'
    && typeof item.done === 'boolean'
    && typeof item.notified === 'boolean'
    && typeof item.dismissed === 'boolean'
    && (item.reminderAt === null || (typeof item.reminderAt === 'string' && Number.isFinite(Date.parse(item.reminderAt))));
}

function readItems (raw: string | null) {
  if (raw === null) {
    return null;
  }

  const saved: unknown = JSON.parse(raw);

  return Array.isArray(saved) && saved.every(isItem) ? saved : null;
}

function readSavedItems () {
  try {
    return readItems(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function load () {
  const { prep } = useProgress();
  const defaults = PREP.map(item => ({
    ...item,
    done: prep.value[item.id] === true,
    reminderAt: null,
    notified: false,
    dismissed: false
  }));

  items.value = readSavedItems() ?? defaults;
}

function currentItems () {
  return (storageWarning.value ? null : readSavedItems()) ?? items.value;
}

function persist (next: ChecklistItem[]) {
  items.value = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    storageWarning.value = false;
  } catch {
    storageWarning.value = true;
  }
}

function update (id: string, change: (item: ChecklistItem) => ChecklistItem) {
  const checklist = currentItems();
  const current = checklist.find(item => item.id === id);

  if (!current) {
    return false;
  }

  const next = change(current);

  if (next !== current) {
    persist(checklist.map(item => item.id === id ? next : item));
  }

  return true;
}

function save (id: string | null, draft: ChecklistDraft) {
  if (id === null) {
    const id = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : crypto.getRandomValues(new Uint32Array(4)).join('-');

    persist([...currentItems(), { ...draft, id, done: false, notified: false, dismissed: false }]);
    return true;
  }

  return update(id, item => ({
    ...item,
    ...draft,
    notified: item.reminderAt === draft.reminderAt && item.notified,
    dismissed: item.reminderAt === draft.reminderAt && item.dismissed
  }));
}

function remove (id: string) {
  persist(currentItems().filter(item => item.id !== id));
}

function toggle (id: string) {
  update(id, item => ({ ...item, done: !item.done }));
}

function markReminder (id: string, reminderAt: string, status: 'notified' | 'dismissed') {
  update(id, item => item.reminderAt === reminderAt && !item.done && !item[status]
    ? { ...item, [status]: true }
    : item);
}

export function useChecklist () {
  if (!loaded) {
    load();
    loaded = true;

    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY && !storageWarning.value) {
        items.value = currentItems();
      }
    });
  }

  return { items: readonly(items), storageWarning: readonly(storageWarning), save, remove, toggle, markReminder };
}
