import type { EmailContent, UserInfo } from '../../app/types/main';

export type SupportedSenator = 'Schiff' | 'Padilla';

export interface JevFormResult {
  status: 'done';
  elapsedMs: number;
  steps: number;
}

export async function submitWithJevUltrafast(
  senator: SupportedSenator,
  email: EmailContent,
  userInfo: UserInfo,
): Promise<JevFormResult> {
  const baseUrl = process.env.JEV_FORM_RUNNER_URL?.trim().replace(/\/$/, '');
  const token = process.env.JEV_FORM_RUNNER_TOKEN?.trim();
  if (!baseUrl || !token) throw new Error('Jev form runner is not configured');

  const response = await fetch(`${baseUrl}/v1/submit-senator-form`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ senator, email, userInfo }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Jev form runner returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 1_000)}` : ''}`);
  }

  const result = await response.json() as Partial<JevFormResult>;
  if (result.status !== 'done' || typeof result.elapsedMs !== 'number' || typeof result.steps !== 'number') {
    throw new Error('Jev form runner returned an invalid result');
  }
  return result as JevFormResult;
}
