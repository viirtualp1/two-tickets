<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { usePlans } from '../composables/usePlans';
import { draftFromPlan, newDay, newItem, parseNotes, toPlan } from '../lib/importTrip';
import type { DraftDay, DraftItem, TripDraft } from '../lib/importTrip';
import { newId, ORIGINAL_ID } from '../lib/plan';
import type { TripPlan } from '../lib/plan';

const route = useRoute();
const router = useRouter();
const { plans, savePlan, selectPlan } = usePlans();
const editing = computed(() => route.query.trip && route.query.trip !== ORIGINAL_ID
  ? plans.value.find(plan => plan.id === route.query.trip) : undefined);
const draft = ref<TripDraft | null>(null);
let openedPlan: TripPlan | undefined;
const source = ref('');
const file = ref<File | null>(null);
const code = ref('');
const busy = ref(false);
const error = ref('');

watch(() => route.query.trip, () => {
  openedPlan = editing.value;
  draft.value = openedPlan ? draftFromPlan(openedPlan) : null;
}, { immediate: true });

watch(editing, plan => {
  if (plan && !draft.value) {
    openedPlan = plan;
    draft.value = draftFromPlan(plan);
  }
});

function reviewNotes () {
  error.value = '';
  draft.value = parseNotes(source.value);
}

function chooseFile (event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function readFile () {
  if (!file.value) return;
  error.value = '';
  busy.value = true;
  try {
    if (file.value.size > 4_200_000) throw new Error('Choose a file under 4 MB. You can import selected PDF pages or paste the text.');
    const form = new FormData();
    form.set('file', file.value);
    form.set('code', code.value);
    const response = await fetch(new URL('api/import', document.baseURI), { method: 'POST', body: form, signal: AbortSignal.timeout(45_000) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) throw new Error(result?.error ?? 'File import is unavailable.');
    if (!Array.isArray(result.days) || !result.days.length) throw new Error('No itinerary days were found.');
    const days = (result.days as DraftDay[]).map(day => newDay({
      ...day, id: newId(), items: day.items.map(item => newItem({ ...item, id: newId() }))
    }));
    draft.value = { id: newId(), title: result.title, timeZone: result.timeZone, days };
    code.value = '';
  } catch (problem) {
    error.value = (problem as Error).message;
  } finally {
    busy.value = false;
  }
}

function move (items: DraftItem[], index: number, offset: number) {
  const [item] = items.splice(index, 1);
  if (item) items.splice(index + offset, 0, item);
}

function save () {
  if (!draft.value) return;
  try {
    if (openedPlan && JSON.stringify(openedPlan) !== JSON.stringify(editing.value)) {
      throw new Error('This trip changed on another device. Reopen the editor to review the latest version before saving.');
    }
    const plan = toPlan(draft.value);
    savePlan(plan);
    selectPlan(plan.id);
    void router.push({ name: 'home' });
  } catch (problem) {
    error.value = (problem as Error).message;
  }
}

const input = 'min-h-11 min-w-0 w-full rounded-xl border border-line bg-paper px-3 text-base font-normal';
const action = 'min-h-11 rounded-full bg-tint px-4 text-sm font-bold text-accent-ink disabled:opacity-50';
</script>

<template>
  <main class="mx-auto flex max-w-md flex-col gap-4 px-4 pb-16 pt-[max(16px,env(safe-area-inset-top))]">
    <RouterLink to="/" class="inline-flex min-h-11 items-center gap-1 self-start rounded-full px-2 font-bold"><AppIcon name="back" /> All days</RouterLink>
    <h1 class="px-1 text-[34px] font-extrabold tracking-tight">{{ editing ? 'Edit trip' : draft ? 'Review trip' : 'Import trip' }}</h1>
    <template v-if="!draft">
      <form class="grid gap-2 rounded-3xl bg-card p-5" @submit.prevent="reviewNotes">
        <label class="grid gap-1 font-bold">
          Paste notes
          <textarea v-model="source" rows="7" maxlength="50000" :class="input" class="py-2" placeholder="Trip: Weekend in Tbilisi&#10;2026-12-21 | Tbilisi | Old Town&#10;09:00 Narikala | Bring walking shoes" />
        </label>
        <p class="text-sm text-muted">Start each day with YYYY-MM-DD. Add each stop on its own line. You can fill in missing dates in the draft.</p>
        <button type="submit" :disabled="busy" :class="action">{{ source.trim() ? 'Review notes' : 'Start a blank draft' }}</button>
      </form>
      <form class="grid gap-2 rounded-3xl bg-card p-5" @submit.prevent="readFile">
        <label class="grid gap-1 font-bold">
          PDF or photo
          <input type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp" class="min-h-11 w-full pt-2 text-sm" @change="chooseFile">
        </label>
        <p class="text-sm text-muted">PDF, JPEG, PNG, or WebP up to 4 MB. The file is sent to OpenAI to extract the itinerary.</p>
        <label class="grid gap-1 text-sm font-bold">Setup code <input v-model="code" type="password" required autocomplete="off" :class="input"></label>
        <button type="submit" :disabled="busy" :class="action">{{ busy ? 'Reading file…' : 'Analyze file' }}</button>
      </form>
    </template>
    <form v-else class="grid gap-4" @submit.prevent="save">
      <div class="grid gap-3 rounded-3xl bg-card p-5">
        <label class="grid gap-1 text-sm font-bold">Trip name <input v-model="draft.title" maxlength="120" :class="input"></label>
        <label class="grid gap-1 text-sm font-bold">Time zone <input v-model="draft.timeZone" placeholder="Asia/Tbilisi" :class="input"></label>
      </div>
      <section v-for="(day, index) in draft.days" :key="day.id" class="grid gap-3 rounded-3xl bg-card p-4" :aria-label="'Day ' + (index + 1)">
        <div class="flex items-center justify-between gap-2">
          <h2 class="min-w-0 text-xl font-extrabold break-words">{{ day.title || 'Day ' + (index + 1) }}</h2>
          <button type="button" class="min-h-11 shrink-0 text-sm font-bold text-accent-ink" @click="day.removed = !day.removed">{{ day.removed ? 'Undo day removal' : 'Remove day' }}</button>
        </div>
        <template v-if="!day.removed">
          <label class="grid gap-1 text-sm font-bold">Date <input v-model="day.date" type="date" :class="input"></label>
          <div class="grid grid-cols-2 gap-2">
            <label class="grid gap-1 text-sm font-bold">City <input v-model="day.city" :class="input"></label>
            <label class="grid gap-1 text-sm font-bold">Day title <input v-model="day.title" :class="input"></label>
          </div>
          <details class="rounded-2xl border border-line px-3">
            <summary class="min-h-11 py-2.5 font-bold">Day notes and hotel</summary>
            <div class="grid gap-2 pb-3">
              <label class="grid gap-1 text-sm font-bold">Start time <input v-model="day.start" placeholder="08:30" :class="input"></label>
              <label class="grid gap-1 text-sm font-bold">Day note <textarea v-model="day.note" :class="input"></textarea></label>
              <label class="grid gap-1 text-sm font-bold">Hotel <input v-model="day.hotel" :class="input"></label>
              <label class="grid gap-1 text-sm font-bold">Local hotel name <input v-model="day.hotelLocalName" :class="input"></label>
              <label class="grid gap-1 text-sm font-bold">Address or directions <input v-model="day.hotelAddress" :class="input"></label>
            </div>
          </details>
          <div v-for="(item, position) in day.items" :key="item.id" class="grid gap-2 rounded-2xl border border-line p-3">
            <div class="flex items-center justify-between gap-2">
              <p class="min-w-0 break-words font-bold">{{ item.name || (item.kind === 'leg' ? 'Travel leg' : 'Stop') }}</p>
              <button type="button" class="min-h-11 shrink-0 text-sm font-bold text-accent-ink" @click="item.removed = !item.removed">{{ item.removed ? 'Undo' : 'Remove' }}</button>
            </div>
            <p v-if="item.removed && (day.items[position - 1]?.kind === 'leg' || day.items[position + 1]?.kind === 'leg')" class="text-xs text-muted">Check nearby travel legs after removing this stop.</p>
            <details v-if="!item.removed">
              <summary class="min-h-11 py-2.5 text-sm font-bold text-accent-ink">Edit details</summary>
              <div class="grid gap-2 pb-2">
                <label class="grid gap-1 text-sm font-bold">Name <input v-model="item.name" :class="input"></label>
                <label class="grid gap-1 text-sm font-bold">Type <select v-model="item.kind" :class="input"><option value="stop">Stop</option><option value="leg">Travel leg</option><option value="hotel">Hotel check-in or check-out</option></select></label>
                <label v-if="item.kind === 'leg'" class="grid gap-1 text-sm font-bold">Transport <select v-model="item.mode" :class="input"><option value="transfer">Transfer</option><option value="metro">Metro</option><option value="walk">Walk</option><option value="flight">Flight</option></select></label>
                <label class="grid gap-1 text-sm font-bold">Time <input v-model="item.at" placeholder="09:00" :class="input"></label>
                <label v-if="item.kind === 'stop'" class="grid gap-1 text-sm font-bold">Local place name <input v-model="item.localName" :class="input"></label>
                <label v-if="item.kind === 'stop'" class="grid gap-1 text-sm font-bold">Opening hours <input v-model="item.hours" placeholder="09:00-18:00" :class="input"></label>
                <label class="grid gap-1 text-sm font-bold">Note <textarea v-model="item.note" :class="input"></textarea></label>
                <p v-if="item.source" class="break-words text-xs text-muted">Source › {{ item.source }}</p>
              </div>
            </details>
            <div v-if="!item.removed" class="flex gap-2">
              <button v-if="position > 0" type="button" :class="action" @click="move(day.items, position, -1)">Move up</button>
              <button v-if="position < day.items.length - 1" type="button" :class="action" @click="move(day.items, position, 1)">Move down</button>
            </div>
          </div>
          <button type="button" :class="action" @click="day.items.push(newItem())">Add stop</button>
        </template>
      </section>
      <button type="button" :class="action" @click="draft.days.push(newDay())">Add day</button>
      <p v-if="error" class="text-sm font-bold text-accent-ink" role="alert">{{ error }}</p>
      <button type="submit" class="min-h-12 rounded-full bg-accent px-4 font-bold text-white">{{ editing ? 'Save changes' : 'Save trip' }}</button>
    </form>
    <p v-if="error && !draft" class="text-sm font-bold text-accent-ink" role="alert">{{ error }}</p>
  </main>
</template>
