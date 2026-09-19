import type { StoredCallRequest } from '../types';

export interface StartVoiceCallResult {
  provider: 'vapi';
  providerCallId: string;
  voiceId: string;
}

export interface VoiceProvider {
  startCall(call: StoredCallRequest): Promise<StartVoiceCallResult>;
}
