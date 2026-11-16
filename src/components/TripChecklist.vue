<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import AppIcon from './AppIcon.vue';
import { useChecklist } from '../composables/useChecklist';
import { useNotificationPermission } from '../composables/useChecklistReminders';
import { downloadCalendarReminder, reminderLabel, toLocalDateTime } from '../lib/calendarReminder';
import type { ChecklistItem } from '../composables/useChecklist';

const props = defineProps<{ heading: string; tripId: string }>();

const { items, storageWarning, save, remove, toggle } = useChecklist(() => props.tripId);
const { browserNotifications, permission, enableNotifications } = useNotificationPermission();
const editor = useTemplateRef<HTMLDialogElement>('editor');
const addButton = useTemplateRef<HTMLButtonElement>('addButton');
const titleInput = useTemplateRef<HTMLInputElement>('titleInput');
const reminderInput = useTemplateRef<HTMLInputElement>('reminderInput');
const confirmButton = useTemplateRef<HTMLButtonElement>('confirmButton');
const deleteButton = useTemplateRef<HTMLButtonElement>('deleteButton');
const editingId = ref<string | null>(null);
const title = ref('');
const why = ref('');
const reminderTime = ref('');
const error = ref('');
const confirmDelete = ref(false);

const done = computed(() => items.value.filter(item => item.done).length);
const editingItem = computed(() => items.value.find(item => item.id === editingId.value));
const savedReminder = computed(() => {
  const item = editingItem.value;

  if (!item?.reminderAt || item.done || reminderTime.value !== toLocalDateTime(item.reminderAt)) {
    return null;
  }

  return item.title === title.value.trim() && item.why === why.value.trim() ? item : null;
});

function openEditor (item?: ChecklistItem) {
  editingId.value = item?.id ?? null;
  title.value = item?.title ?? '';
  why.value = item?.why ?? '';
  reminderTime.value = item?.reminderAt ? toLocalDateTime(item.reminderAt) : '';
  error.value = '';
  confirmDelete.value = false;
  editor.value?.showModal();
}

function submit () {
  if (!title.value.trim()) {
    error.value = 'Enter a to-do title.';
    titleInput.value?.focus();
    return;
  }

  const reminder = reminderTime.value ? new Date(reminderTime.value) : null;

  if (reminder && !Number.isFinite(reminder.getTime())) {
    error.value = 'Choose a valid date and time.';
    reminderInput.value?.focus();
    return;
  }

  const previous = editingItem.value?.reminderAt;
  // Keep the original instant when editing text, including during a repeated DST hour.
  const reminderAt = previous && reminderTime.value === toLocalDateTime(previous) ? previous : reminder?.toISOString() ?? null;

  if (reminderAt && toLocalDateTime(reminderAt) !== reminderTime.value) {
    error.value = 'This time does not exist in your device’s time zone. Choose another time.';
    reminderInput.value?.focus();
    return;
  }

  if (!save(editingId.value, { title: title.value.trim(), why: why.value.trim(), reminderAt })) {
    error.value = 'This to-do was removed elsewhere. Close the editor and add it again.';
    return;
  }

  editor.value?.close();
}

async function requestDelete () {
  confirmDelete.value = true;
  await nextTick();
  confirmButton.value?.focus();
}

async function cancelDelete () {
  confirmDelete.value = false;
  await nextTick();
  deleteButton.value?.focus();
}

async function deleteItem () {
  if (editingId.value) {
    remove(editingId.value);
  }

  editor.value?.close();
  await nextTick();
  addButton.value?.focus({ preventScroll: true });
}

function downloadReminder () {
  if (savedReminder.value?.reminderAt) {
    downloadCalendarReminder(savedReminder.value, savedReminder.value.reminderAt);
  }
}
</script>

<template>
  <section aria-labelledby="prep-title">
    <div class="flex items-center justify-between gap-3 px-1">
      <div>
        <h2
          id="prep-title"
          tabindex="-1"
          class="scroll-mt-[max(16px,env(safe-area-inset-top))] text-2xl font-extrabold tracking-tight"
        >
          {{ heading }}
        </h2>
        <p
          v-if="items.length"
          class="text-sm text-muted"
        >{{ done }} of {{ items.length }} sorted</p>
      </div>
      <button
        ref="addButton"
        type="button"
        class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-tint px-4 text-sm font-bold text-accent-ink"
        @click="openEditor()"
      >
        <AppIcon
          name="plus"
          :size="17"
        />
        Add to-do
      </button>
    </div>

    <p
      v-if="storageWarning"
      class="mt-2 px-1 text-sm text-soon"
      role="status"
    >Changes are available for this visit only. This device couldn’t save the checklist.</p>

    <ul
      v-if="items.length"
      class="mt-3 divide-y divide-line rounded-3xl bg-card px-2"
    >
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-start gap-1"
      >
        <button
          type="button"
          class="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-2 py-3.5 text-left"
          :aria-pressed="item.done"
          :aria-label="item.title"
          @click="toggle(item.id)"
        >
          <span
            class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition"
            :class="item.done ? 'border-accent bg-accent text-white' : 'border-muted/60 text-transparent'"
          >
            <AppIcon
              name="check"
              :size="14"
              :stroke="3"
            />
          </span>
          <span class="flex min-w-0 flex-col gap-0.5">
            <span
              class="wrap-break-word font-bold leading-snug"
              :class="item.done ? 'text-muted line-through decoration-muted/50' : ''"
            >{{ item.title }}</span>
            <span
              v-if="item.why"
              class="wrap-break-word whitespace-pre-line text-[13px] leading-snug text-muted"
            >{{ item.why }}</span>
            <span
              v-if="item.reminderAt && !item.done"
              class="mt-1 flex items-center gap-1 text-xs font-bold text-accent-ink"
            >
              <AppIcon
                name="clock"
                :size="14"
              />
              <time :datetime="item.reminderAt">{{ reminderLabel(item.reminderAt) }}</time>
            </span>
          </span>
        </button>
        <button
          type="button"
          class="mt-1 grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-tint hover:text-accent-ink"
          :aria-label="`Edit ${item.title}`"
          @click="openEditor(item)"
        >
          <AppIcon
            name="edit"
            :size="18"
          />
        </button>
      </li>
    </ul>
    <p
      v-else
      class="mt-3 rounded-3xl bg-card px-4 py-4 text-sm text-muted"
    >No to-dos yet.</p>

    <dialog
      ref="editor"
      class="fixed inset-x-0 bottom-0 top-auto mx-auto my-0 max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[32px] bg-paper px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 text-ink backdrop:bg-ink/40"
      aria-labelledby="checklist-editor-title"
      @click.self="editor?.close()"
    >
      <form
        class="flex flex-col gap-4"
        @input="error = ''"
        @submit.prevent="submit"
      >
        <span
          class="mx-auto h-1 w-10 rounded-full bg-line"
          aria-hidden="true"
        />
        <div class="flex items-center justify-between gap-3">
          <h2
            id="checklist-editor-title"
            class="text-[26px] font-extrabold leading-tight tracking-tight"
          >{{ editingId ? 'Edit to-do' : 'Add to-do' }}</h2>
          <button
            type="button"
            class="-mr-2 grid size-11 shrink-0 place-items-center rounded-full"
            aria-label="Close"
            @click="editor?.close()"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <label class="grid gap-1 text-sm font-bold">
          To-do
          <input
            ref="titleInput"
            v-model="title"
            class="min-h-12 min-w-0 rounded-2xl border border-line bg-card px-4 text-base font-semibold"
            :maxlength="140"
            required
            autofocus
          >
        </label>
        <label class="grid gap-1 text-sm font-bold">
          Note <span class="sr-only">(optional)</span>
          <textarea
            v-model="why"
            class="min-w-0 resize-y rounded-2xl border border-line bg-card px-4 py-3 text-base font-normal"
            :maxlength="1000"
            rows="2"
          />
        </label>
        <div class="grid gap-1">
          <label class="grid gap-1 text-sm font-bold">
            Remind me <span class="sr-only">(optional)</span>
            <input
              ref="reminderInput"
              v-model="reminderTime"
              type="datetime-local"
              class="min-h-12 w-full min-w-0 rounded-2xl border border-line bg-card px-4 text-base font-normal"
              :step="60"
              max="9999-12-31T23:59"
              aria-describedby="reminder-help"
            >
          </label>
          <p
            id="reminder-help"
            class="text-xs leading-snug text-muted"
          >
            Uses this device’s time zone.
            <template v-if="reminderTime"> For alerts while the app is closed, import the calendar file after saving and check that the event has an alert.</template>
          </p>
          <div class="flex flex-wrap gap-x-4">
            <button
              v-if="reminderTime"
              type="button"
              class="min-h-11 text-left text-sm font-bold text-accent-ink"
              @click="reminderTime = ''"
            >Clear reminder</button>
            <button
              v-if="savedReminder"
              type="button"
              class="min-h-11 text-left text-sm font-bold text-accent-ink"
              @click="downloadReminder"
            >Download calendar file</button>
            <button
              v-if="reminderTime && browserNotifications && permission === 'default'"
              type="button"
              class="min-h-11 text-left text-sm font-bold text-accent-ink"
              @click="enableNotifications"
            >Enable device notifications</button>
          </div>
          <p
            v-if="reminderTime && browserNotifications && permission === 'granted'"
            class="text-xs text-muted"
          >Device notifications are enabled while Two Tickets is running.</p>
        </div>

        <p
          v-if="error"
          class="text-sm font-semibold text-accent-ink"
          role="alert"
        >{{ error }}</p>
        <div
          v-if="confirmDelete"
          class="grid gap-2 rounded-3xl bg-card p-4"
        >
          <p class="font-bold">Delete this to-do?</p>
          <p
            v-if="editingItem?.reminderAt"
            class="text-sm text-muted"
          >If you imported its reminder, remove the event from your calendar too.</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="h-11 rounded-full border-2 border-line px-4 text-sm font-bold"
              @click="cancelDelete"
            >Keep it</button>
            <button
              ref="confirmButton"
              type="button"
              class="h-11 rounded-full bg-accent px-4 text-sm font-bold text-white"
              @click="deleteItem"
            >Delete</button>
          </div>
        </div>
        <template v-else>
          <button
            type="submit"
            class="h-13 rounded-full bg-accent font-bold text-white"
          >{{ editingId ? 'Save changes' : 'Add to-do' }}</button>
          <button
            v-if="editingId"
            ref="deleteButton"
            type="button"
            class="h-11 rounded-full text-sm font-bold text-accent-ink"
            @click="requestDelete"
          >Delete to-do</button>
        </template>
      </form>
    </dialog>
  </section>
</template>
