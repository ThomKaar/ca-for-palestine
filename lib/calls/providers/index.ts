import type { VoiceProvider } from './types';
import { VapiProvider } from './vapi';

export function voiceProvider(): VoiceProvider {
  const provider = process.env.VOICE_PROVIDER || 'vapi';
  if (provider !== 'vapi') throw new Error(`Unsupported voice provider: ${provider}`);
  return new VapiProvider();
}

export function liveVoiceCallsEnabled(): boolean {
  return process.env.VOICE_CALLS_ENABLED === 'true';
}
