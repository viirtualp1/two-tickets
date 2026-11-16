import { readonly, ref } from 'vue';
import type { Ref } from 'vue';

const STORAGE_KEY = 'two-tickets:v1';
const visited = ref<Record<string, boolean>>({});
const prep = ref<Record<string, boolean>>({});
let loaded = false;

function isFlagMap (value: unknown): value is Record<string, boolean> {
  return typeof value === 'object' && value !== null && Object.values(value).every(flag => typeof flag === 'boolean');
}

function load () {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');

    if (typeof saved !== 'object' || saved === null) {
      return;
    }

    if ('visited' in saved && isFlagMap(saved.visited)) {
      visited.value = saved.visited;
    }

    if ('prep' in saved && isFlagMap(saved.prep)) {
      prep.value = saved.prep;
    }
  } catch {
    // Unreadable or blocked storage: start with nothing ticked.
  }
}

function persist () {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ visited: visited.value, prep: prep.value }));
  } catch {
    // Private browsing can block storage; ticks then last for this visit only.
  }
}

function flip (map: Ref<Record<string, boolean>>, id: string) {
  const next = { ...map.value };

  if (next[id]) {
    delete next[id];
  } else {
    next[id] = true;
  }

  map.value = next;
  persist();
}

function toggleVisited (id: string) {
  flip(visited, id);
}

export function useProgress () {
  if (!loaded) {
    load();
    loaded = true;
  }

  return {
    visited: readonly(visited),
    prep: readonly(prep),
    toggleVisited
  };
}
