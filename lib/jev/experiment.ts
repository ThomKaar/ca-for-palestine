import { createHash } from 'node:crypto';

export type FormFillVariant = 'legacy' | 'jev_ultrafast';

export function jevFormRunnerIsConfigured(): boolean {
  return Boolean(
    process.env.JEV_FORM_EXPERIMENT_ENABLED === 'true' &&
    process.env.JEV_FORM_RUNNER_URL?.trim() &&
    process.env.JEV_FORM_RUNNER_TOKEN?.trim() &&
    process.env.JEV_FORM_EXPERIMENT_SALT?.trim(),
  );
}

function treatmentPercent(): number {
  const value = Number(process.env.JEV_FORM_TREATMENT_PERCENT ?? '50');
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, value));
}

export function assignFormFillVariant(stableUserKey: string): FormFillVariant {
  if (!jevFormRunnerIsConfigured()) return 'legacy';

  const salt = process.env.JEV_FORM_EXPERIMENT_SALT!.trim();
  const digest = createHash('sha256')
    .update(`${salt}:${stableUserKey.trim().toLowerCase()}`)
    .digest();
  const bucket = digest.readUInt32BE(0) / 0x1_0000_0000 * 100;
  return bucket < treatmentPercent() ? 'jev_ultrafast' : 'legacy';
}
