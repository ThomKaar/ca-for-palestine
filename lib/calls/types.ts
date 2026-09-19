import type { ModerationStatus } from './moderation';
import type { SenatorId } from './config';

export interface CallRequestInput {
  firstName: string;
  lastName: string;
  city: string;
  zipCode: string;
  email: string;
  senators: SenatorId[];
  script: string;
}

export type CallStatus =
  | 'pending_review'
  | 'scheduled'
  | 'dialing'
  | 'delivered_live'
  | 'delivered_receptionist'
  | 'delivered_voicemail'
  | 'consent_declined'
  | 'failed'
  | 'rejected'
  | 'canceled';

export type DeliveryOutcome =
  | 'live'
  | 'receptionist'
  | 'voicemail'
  | 'consent_declined'
  | 'failed';

export interface StoredCallRequest extends CallRequestInput {
  id: string;
  senator: SenatorId;
  status: CallStatus;
  moderationStatus: ModerationStatus;
  scheduledFor: Date | null;
  authorizationDay: string;
  createdAt: Date;
  purgeAt: Date;
  attempts: number;
  retryDeadline: Date;
  lastAttemptAt?: Date;
  provider?: 'vapi';
  providerCallId?: string;
  voiceId?: string;
  reservedCostUsd?: number;
  actualCostUsd?: number;
  endedReason?: string;
  transcript?: string;
  summary?: string;
  staffFollowUp?: string;
  reportedOutcome?: DeliveryOutcome;
  transcriptionConsentGranted?: boolean;
  officeStopRequested?: boolean;
  completedAt?: Date;
}
