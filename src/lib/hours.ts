export type OpenTone = 'open' | 'soon' | 'later' | 'closed';

export interface OpenStatus {
  tone: OpenTone
  text: string
}

const MINUTES_PER_DAY = 1440;
const CLOSING_SOON_MINUTES = 60;

export function toMinutes (time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');

  return Number(hours) * 60 + Number(minutes);
}

export function formatMinutes (total: number) {
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;

  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function parseHours (hours: string): Array<[number, number]> {
  if (!hours) {
    return [];
  }

  if (hours === '24h') {
    return [[0, MINUTES_PER_DAY * 2]];
  }

  return hours.split(',').map(range => {
    const [from = '', to = ''] = range.split('-');
    const open = from ? toMinutes(from) : 0;
    let close = toMinutes(to);

    // A bar listed as 18:30–2:00 closes after midnight, on the same night.
    if (close <= open) {
      close += MINUTES_PER_DAY;
    }

    return [open, close];
  });
}

export function hoursLabel (hours: string) {
  if (!hours) {
    return '';
  }

  if (hours === '24h') {
    return 'open 24 hours';
  }

  if (hours.startsWith('-')) {
    return `closes ${hours.slice(1)}`;
  }

  return hours.replaceAll('-', '–').replace(',', ' & ');
}

export function openStatus (hours: string, minutes: number): OpenStatus | null {
  const spans = parseHours(hours);

  if (!spans.length) {
    return null;
  }

  if (hours === '24h') {
    return { tone: 'open', text: 'Open all day' };
  }

  for (const [open, close] of spans) {
    if (minutes >= open && minutes < close) {
      const left = close - minutes;

      if (left <= CLOSING_SOON_MINUTES) {
        return { tone: 'soon', text: `Closes in ${left} min` };
      }

      return { tone: 'open', text: `Open till ${formatMinutes(close)}` };
    }
  }

  const later = spans.find(([open]) => open > minutes);

  if (later) {
    return { tone: 'later', text: `Opens ${formatMinutes(later[0])}` };
  }

  return { tone: 'closed', text: 'Closed by then' };
}
