export const SENATORS = ['schiff', 'padilla'] as const;

export type SenatorId = (typeof SENATORS)[number];

export const SENATOR_NAMES: Record<SenatorId, string> = {
  schiff: 'Senator Adam Schiff',
  padilla: 'Senator Alex Padilla',
};

export const DEFAULT_CALL_SCRIPT = `I am asking the Senator to support concrete steps toward divestment from systems that sustain Israel's occupation and apartheid, to oppose further weapons transfers that contribute to harm against Palestinian civilians, and to support unrestricted humanitarian aid and lasting Palestinian freedom and safety.

Please record this constituent's request and share the Senator's current position and the actions the Senator intends to take.`;

export const MAX_SCRIPT_WORDS = 250;
export const VERIFICATION_CODE_TTL_MINUTES = 10;
export const CALL_RECORD_TTL_DAYS = 30;
export const DAILY_SPEND_LIMIT_USD = 5;
export const MAX_CALL_DURATION_SECONDS = 180;
export const MAX_ATTEMPTS = 3;
export const MIN_RETRY_MINUTES = 30;

export const SENATOR_PHONE_ENV: Record<SenatorId, string> = {
  schiff: 'SCHIFF_DC_PHONE_E164',
  padilla: 'PADILLA_DC_PHONE_E164',
};

export const ROTATING_VAPI_VOICES = ['Elliot', 'Savannah', 'Emma', 'Clara', 'Nico', 'Kai'] as const;

export function estimatedCallReservationUsd(): number {
  const configured = Number(process.env.VOICE_ESTIMATED_COST_PER_MINUTE_USD ?? '0.25');
  const perMinute = Number.isFinite(configured) && configured > 0 ? configured : 0.25;
  return Number(((MAX_CALL_DURATION_SECONDS / 60) * perMinute).toFixed(4));
}

export function senatorPhoneNumber(senator: SenatorId): string | null {
  const value = process.env[SENATOR_PHONE_ENV[senator]]?.trim();
  return value && /^\+[1-9]\d{7,14}$/.test(value) ? value : null;
}

export function isSenatorId(value: unknown): value is SenatorId {
  return typeof value === 'string' && SENATORS.includes(value as SenatorId);
}
