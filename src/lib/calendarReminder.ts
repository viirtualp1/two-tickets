import type { ChecklistItem } from '../composables/useChecklist';

export function reminderLabel (value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function toLocalDateTime (value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

function calendarDate (value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function calendarText (value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

function foldLine (line: string) {
  const encoder = new TextEncoder();
  let bytes = 0;
  let result = '';

  for (const character of line) {
    const size = encoder.encode(character).length;

    if (bytes + size > 75) {
      result += '\r\n ';
      bytes = 1;
    }

    result += character;
    bytes += size;
  }

  return result;
}

function calendarReminder (item: ChecklistItem, reminderAt: string) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Two Tickets//Checklist Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${calendarText(item.id)}@two-tickets`,
    `DTSTAMP:${calendarDate(new Date().toISOString())}`,
    `DTSTART:${calendarDate(reminderAt)}`,
    `SUMMARY:${calendarText(item.title)}`,
    `DESCRIPTION:${calendarText(item.why)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${calendarText(item.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].map(foldLine).join('\r\n');
}

export function downloadCalendarReminder (item: ChecklistItem, reminderAt: string) {
  const file = new Blob([calendarReminder(item, reminderAt)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'two-tickets-reminder.ics';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
