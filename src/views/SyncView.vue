<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { useTripSync } from '../composables/useTripSync';

const route = useRoute();
const router = useRouter();
const { status, paired, conflicts, connection, invite, join, sync, revoke, disconnect, keepMine, clearConflicts } = useTripSync();
const error = ref('');
const link = ref('');
const code = ref('');
const inviteToPaste = ref('');
const busy = ref(false);
const copied = ref(false);
const incoming = computed(() => typeof route.query.room === 'string' && typeof route.query.invite === 'string'
  ? { room: route.query.room, invite: route.query.invite } : null);

async function run (action: () => Promise<unknown> | null) {
  busy.value = true;
  error.value = '';

  try {
    await action();
  } catch (problem) {
    error.value = (problem as Error).message;
  } finally {
    busy.value = false;
  }
}

function makeLink () {
  void run(async () => { link.value = await invite(code.value); code.value = ''; copied.value = false; });
}

function accept (target = incoming.value) {
  if (!target) return;
  void run(async () => {
    await join(target.room, target.invite);
    await router.replace({ name: 'sync' });
  });
}

function acceptPastedLink () {
  const url = URL.parse(inviteToPaste.value.trim());
  const [page, query] = url?.hash.slice(1).split('?') ?? [];
  const params = new URLSearchParams(query);
  const room = params.get('room');
  const invite = params.get('invite');
  if (url?.origin !== location.origin || url.pathname !== location.pathname || page !== '/sync' || !room || !invite) {
    error.value = 'Paste a pairing link from this Two Tickets site.';
    return;
  }
  accept({ room, invite });
}

function copy () {
  void run(async () => {
    await navigator.clipboard.writeText(link.value);
    copied.value = true;
  });
}
</script>

<template>
  <main class="mx-auto flex max-w-md flex-col gap-5 px-4 pb-16 pt-[max(16px,env(safe-area-inset-top))]">
    <RouterLink to="/" class="inline-flex min-h-11 items-center gap-1 self-start rounded-full px-2 font-bold"><AppIcon name="back" /> Home</RouterLink>
    <h1 class="px-1 text-[34px] font-extrabold tracking-tight">Sync devices</h1>
    <section class="grid gap-3 rounded-3xl bg-card p-5">
      <p class="font-bold" role="status">{{ status }}</p>
      <p class="text-sm text-muted">Share trips, checklists, and visited places between two devices. Changes made offline sync when you reconnect.</p>
      <template v-if="incoming && !connection">
        <button type="button" :disabled="busy" class="min-h-12 rounded-full bg-accent px-4 font-bold text-white disabled:opacity-50" @click="accept()">Pair this device</button>
      </template>
      <template v-else-if="!connection || (connection.owner && !paired)">
        <form class="grid gap-3" @submit.prevent="makeLink">
          <label v-if="!connection" class="grid gap-1 text-sm font-bold">
            Setup code
            <input v-model="code" type="password" required autocomplete="off" class="min-h-11 rounded-2xl border border-line px-3 text-base">
          </label>
          <button type="submit" :disabled="busy" class="min-h-12 rounded-full bg-accent px-4 font-bold text-white disabled:opacity-50">Create pairing link</button>
        </form>
        <div v-if="link" class="grid gap-2">
          <label class="grid gap-1 text-sm font-bold">
            Open this link on the second device within 15 minutes.
            <input :value="link" readonly class="min-h-11 rounded-2xl border border-line px-3 font-normal" @focus="($event.target as HTMLInputElement).select()">
          </label>
          <button type="button" class="min-h-11 rounded-full bg-tint font-bold text-accent-ink" @click="copy">{{ copied ? 'Copied' : 'Copy link' }}</button>
        </div>
        <details v-if="!connection" class="rounded-2xl border border-line px-3">
          <summary class="min-h-11 py-2.5 font-bold">Join with a link</summary>
          <form class="grid gap-2 pb-3" @submit.prevent="acceptPastedLink">
            <label class="grid gap-1 text-sm font-bold">
              Pairing link
              <input v-model="inviteToPaste" type="url" required class="min-h-11 min-w-0 rounded-xl border border-line px-3 text-base">
            </label>
            <button type="submit" :disabled="busy" class="min-h-11 rounded-full bg-tint font-bold text-accent-ink disabled:opacity-50">Pair this device</button>
          </form>
        </details>
      </template>
      <template v-if="connection">
        <p v-if="paired" class="text-sm font-bold">Two devices paired</p>
        <button type="button" :disabled="busy" class="min-h-11 rounded-full border border-line font-bold disabled:opacity-50" @click="run(sync)">Sync now</button>
        <button v-if="connection.owner && paired" type="button" :disabled="busy" class="min-h-11 font-bold text-accent-ink" @click="run(revoke)">Remove the other device</button>
        <button v-if="!connection.owner" type="button" :disabled="busy" class="min-h-11 font-bold text-accent-ink" @click="run(disconnect)">Disconnect this device</button>
      </template>
      <p v-if="error" class="text-sm font-bold text-accent-ink" role="alert">{{ error }}</p>
    </section>
    <section v-if="Object.keys(conflicts).length" class="grid gap-3 rounded-3xl bg-card p-5" aria-labelledby="conflicts-title">
      <h2 id="conflicts-title" class="text-xl font-extrabold">Changes on both devices</h2>
      <p class="text-sm text-muted">Choose which version to keep for {{ Object.keys(conflicts).length }} conflicting {{ Object.keys(conflicts).length === 1 ? 'change' : 'changes' }}.</p>
      <ul class="grid gap-1 text-sm">
        <li v-for="(value, key) in conflicts" :key="key">
          {{ value && typeof value === 'object' && 'title' in value ? value.title : key.startsWith('visit:') ? 'Visited place' : key.startsWith('plan:') ? 'Trip plan' : 'Checklist deletion' }}
        </li>
      </ul>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="min-h-11 rounded-full bg-tint px-4 font-bold text-accent-ink" @click="keepMine">Keep my changes</button>
        <button type="button" class="min-h-11 rounded-full border border-line px-4 font-bold" @click="clearConflicts">Keep other device’s changes</button>
      </div>
    </section>
  </main>
</template>
