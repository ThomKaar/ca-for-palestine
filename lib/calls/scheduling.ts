import { MIN_RETRY_MINUTES } from './config';

const OFFICE_TIME_ZONE = 'America/New_York';
const SLOT_MINUTES = 5;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
}

function zonedParts(date: Date): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: OFFICE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: value('weekday'),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
  };
}

function nthWeekday(year: number, month: number, weekday: number, nth: number): number {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return 1 + ((7 + weekday - firstWeekday) % 7) + (nth - 1) * 7;
}

function lastWeekday(year: number, month: number, weekday: number): number {
  const lastDay = new Date(Date.UTC(year, month, 0));
  return lastDay.getUTCDate() - ((7 + lastDay.getUTCDay() - weekday) % 7);
}

function observedFixedHoliday(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  if (weekday === 0) date.setUTCDate(day + 1);
  if (weekday === 6) date.setUTCDate(day - 1);
  return date.toISOString().slice(0, 10);
}

function federalHolidayKeys(year: number): Set<string> {
  const key = (month: number, day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return new Set([
    observedFixedHoliday(year, 1, 1),
    key(1, nthWeekday(year, 1, 1, 3)),
    key(2, nthWeekday(year, 2, 1, 3)),
    key(5, lastWeekday(year, 5, 1)),
    observedFixedHoliday(year, 6, 19),
    observedFixedHoliday(year, 7, 4),
    key(9, nthWeekday(year, 9, 1, 1)),
    key(10, nthWeekday(year, 10, 1, 2)),
    observedFixedHoliday(year, 11, 11),
    key(11, nthWeekday(year, 11, 4, 4)),
    observedFixedHoliday(year, 12, 25),
  ]);
}

export function easternDateKey(date: Date): string {
  const parts = zonedParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function isSafeCallTime(date: Date): boolean {
  const parts = zonedParts(date);
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return false;
  if (federalHolidayKeys(parts.year).has(easternDateKey(date))) return false;
  return parts.hour >= 9 && parts.hour < 17;
}

export function nextSafeCallTime(after = new Date()): Date {
  const candidate = new Date(after.getTime() + 15 * 60_000);
  candidate.setUTCSeconds(0, 0);
  const remainder = candidate.getUTCMinutes() % SLOT_MINUTES;
  if (remainder) candidate.setUTCMinutes(candidate.getUTCMinutes() + SLOT_MINUTES - remainder);

  for (let index = 0; index < (14 * 24 * 60) / SLOT_MINUTES; index += 1) {
    if (isSafeCallTime(candidate)) return candidate;
    candidate.setUTCMinutes(candidate.getUTCMinutes() + SLOT_MINUTES);
  }

  throw new Error('Could not find a safe call time in the next two weeks.');
}

export function nextRetryCallTime(after = new Date()): Date {
  return nextSafeCallTime(new Date(after.getTime() + MIN_RETRY_MINUTES * 60_000));
}

export function retryDeadlineFrom(createdAt: Date): Date {
  let candidate = new Date(createdAt);
  let businessDays = 0;
  let previousKey = '';

  for (let index = 0; index < 14 * 24 * 12; index += 1) {
    candidate = new Date(candidate.getTime() + 5 * 60_000);
    if (!isSafeCallTime(candidate)) continue;
    const key = easternDateKey(candidate);
    if (key !== previousKey) {
      businessDays += 1;
      previousKey = key;
    }
    if (businessDays === 2) {
      const parts = zonedParts(candidate);
      const remainingMinutes = (16 - parts.hour) * 60 + (59 - parts.minute);
      return new Date(candidate.getTime() + Math.max(0, remainingMinutes) * 60_000);
    }
  }

  throw new Error('Could not calculate the retry deadline.');
}
