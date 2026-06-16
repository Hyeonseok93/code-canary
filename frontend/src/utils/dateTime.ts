/** Pipeline / sync timestamps: stored as UTC (ISO), displayed in KST. */
const APP_DISPLAY_TIMEZONE = 'Asia/Seoul';

/** Shared sync / pipeline timestamp display (YYYY. MM. DD. HH:mm KST). */
export function formatSyncDateTime(
  iso: string | null | undefined,
  options?: { withSeconds?: boolean; fallback?: string }
): string {
  const fallback = options?.fallback ?? '—';
  if (!iso) {
    return fallback;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_DISPLAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: options?.withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const yyyy = pick('year');
  const mm = pick('month');
  const dd = pick('day');
  const hh = pick('hour');
  const min = pick('minute');

  if (options?.withSeconds) {
    const ss = pick('second');
    return `${yyyy}. ${mm}. ${dd}. ${hh}:${min}:${ss} KST`;
  }

  return `${yyyy}. ${mm}. ${dd}. ${hh}:${min} KST`;
}

/** Explorer vulnerability dates (published, modified, KEV due). */
export function formatVulnDate(iso: string | null | undefined, fallback = 'Unknown'): string {
  if (!iso) {
    return fallback;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString('ko-KR');
}
