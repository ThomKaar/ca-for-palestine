import { createHash, randomUUID } from 'node:crypto';
import { MongoClient, type Db } from 'mongodb';
import { CALL_RECORD_TTL_DAYS, DAILY_SPEND_LIMIT_USD, MAX_ATTEMPTS } from './config';
import type { CallRequestInput, StoredCallRequest } from './types';
import type { ModerationStatus } from './moderation';
import { retryDeadlineFrom } from './scheduling';

interface VerificationRecord {
  key: string;
  purpose: VerificationPurpose;
  email: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export type VerificationPurpose = 'constituent' | 'admin';

interface MemoryStore {
  verifications: Map<string, VerificationRecord>;
  calls: StoredCallRequest[];
  dailyBudget: Map<string, number>;
  pausedSenators: Set<StoredCallRequest['senator']>;
}

declare global {
  // eslint-disable-next-line no-var
  var callsMemoryStore: MemoryStore | undefined;
  // eslint-disable-next-line no-var
  var callsMongoClient: MongoClient | undefined;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashVerificationCode(
  email: string,
  code: string,
  purpose: VerificationPurpose = 'constituent',
): string {
  return createHash('sha256')
    .update(`${purpose}:${normalizeEmail(email)}:${code}:${process.env.CALLS_CODE_SECRET ?? 'development-only-secret'}`)
    .digest('hex');
}

function memoryStore(): MemoryStore {
  globalThis.callsMemoryStore ??= {
    verifications: new Map(),
    calls: [],
    dailyBudget: new Map(),
    pausedSenators: new Set(),
  };
  return globalThis.callsMemoryStore;
}

function mongoUri(): string | null {
  return process.env.MONGODB_URI?.trim() || null;
}

export function hasDurableCallStore(): boolean {
  return Boolean(mongoUri());
}

function canUseMemoryStore(): boolean {
  return process.env.NODE_ENV !== 'production';
}

async function database(): Promise<Db | null> {
  const uri = mongoUri();
  if (!uri) {
    if (canUseMemoryStore()) return null;
    throw new Error('MONGODB_URI is required for production call scheduling.');
  }

  globalThis.callsMongoClient ??= new MongoClient(uri);
  await globalThis.callsMongoClient.connect();
  const db = globalThis.callsMongoClient.db(
    process.env.CALLS_DATABASE_NAME || 'ca-for-palestine-calls',
  );

  await Promise.all([
    db.collection('verificationCodes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('verificationCodes').createIndex({ key: 1 }, { unique: true }),
    db.collection('callRequests').createIndex({ purgeAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('callRequests').createIndex(
      { email: 1, senator: 1, authorizationDay: 1 },
      { unique: true },
    ),
    db.collection('callRequests').createIndex({ providerCallId: 1 }, { unique: true, sparse: true }),
    db.collection('callRequests').createIndex({ status: 1, scheduledFor: 1 }),
  ]);

  return db;
}

export async function saveVerificationCode(
  email: string,
  code: string,
  expiresAt: Date,
  purpose: VerificationPurpose = 'constituent',
): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const key = `${purpose}:${normalizedEmail}`;
  const record: VerificationRecord = {
    key,
    purpose,
    email: normalizedEmail,
    codeHash: hashVerificationCode(normalizedEmail, code, purpose),
    expiresAt,
    createdAt: new Date(),
  };
  const db = await database();

  if (!db) {
    memoryStore().verifications.set(key, record);
    return;
  }

  await db.collection<VerificationRecord>('verificationCodes').replaceOne(
    { key },
    record,
    { upsert: true },
  );
}

export async function consumeVerificationCode(
  email: string,
  code: string,
  purpose: VerificationPurpose = 'constituent',
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const key = `${purpose}:${normalizedEmail}`;
  const codeHash = hashVerificationCode(normalizedEmail, code, purpose);
  const now = new Date();
  const db = await database();

  if (!db) {
    const record = memoryStore().verifications.get(key);
    const valid = Boolean(
      record && record.codeHash === codeHash && record.expiresAt.getTime() > now.getTime(),
    );
    if (valid) memoryStore().verifications.delete(key);
    return valid;
  }

  const record = await db.collection<VerificationRecord>('verificationCodes').findOneAndDelete({
    key,
    codeHash,
    expiresAt: { $gt: now },
  });
  return Boolean(record);
}

export async function listCallRequests(limit = 100): Promise<StoredCallRequest[]> {
  const db = await database();
  if (!db) {
    return [...memoryStore().calls]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }

  return db
    .collection<StoredCallRequest>('callRequests')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function deliveredCallCounts(): Promise<Record<StoredCallRequest['senator'], number>> {
  const deliveredStatuses: StoredCallRequest['status'][] = [
    'delivered_live', 'delivered_receptionist', 'delivered_voicemail',
  ];
  const db = await database();
  if (!db) {
    return memoryStore().calls.reduce(
      (counts, call) => {
        if (deliveredStatuses.includes(call.status)) counts[call.senator] += 1;
        return counts;
      },
      { schiff: 0, padilla: 0 },
    );
  }
  const rows = await db.collection<StoredCallRequest>('callRequests').aggregate<{ _id: StoredCallRequest['senator']; count: number }>([
    { $match: { status: { $in: deliveredStatuses } } },
    { $group: { _id: '$senator', count: { $sum: 1 } } },
  ]).toArray();
  const counts = { schiff: 0, padilla: 0 };
  for (const row of rows) counts[row._id] = row.count;
  return counts;
}

export async function updateCallRequest(
  id: string,
  update: Partial<StoredCallRequest>,
): Promise<StoredCallRequest | null> {
  const db = await database();
  if (!db) {
    const record = memoryStore().calls.find((call) => call.id === id);
    if (!record) return null;
    Object.assign(record, update);
    return record;
  }

  return db.collection<StoredCallRequest>('callRequests').findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: 'after' },
  );
}

export async function claimNextDueCall(now = new Date()): Promise<StoredCallRequest | null> {
  const db = await database();
  const paused: Set<StoredCallRequest['senator']> = db
    ? new Set((await db.collection<{ senator: StoredCallRequest['senator']; paused: boolean }>('callQueuePauses').find({ paused: true }).toArray()).map((item) => item.senator))
    : memoryStore().pausedSenators;

  if (!db) {
    const call = memoryStore().calls
      .filter((item) =>
        item.status === 'scheduled' &&
        item.scheduledFor &&
        item.scheduledFor <= now &&
        item.retryDeadline > now &&
        item.attempts < MAX_ATTEMPTS &&
        !paused.has(item.senator),
      )
      .sort((left, right) => left.scheduledFor!.getTime() - right.scheduledFor!.getTime())[0];
    if (!call) return null;
    call.status = 'dialing';
    call.attempts += 1;
    call.lastAttemptAt = now;
    return call;
  }

  return db.collection<StoredCallRequest>('callRequests').findOneAndUpdate(
    {
      status: 'scheduled',
      scheduledFor: { $lte: now },
      retryDeadline: { $gt: now },
      attempts: { $lt: MAX_ATTEMPTS },
      senator: { $nin: Array.from(paused) },
    },
    { $set: { status: 'dialing', lastAttemptAt: now }, $inc: { attempts: 1 } },
    { sort: { scheduledFor: 1 }, returnDocument: 'after' },
  );
}

export async function findCallByProviderId(providerCallId: string): Promise<StoredCallRequest | null> {
  const db = await database();
  if (!db) return memoryStore().calls.find((call) => call.providerCallId === providerCallId) ?? null;
  return db.collection<StoredCallRequest>('callRequests').findOne({ providerCallId });
}

export async function reserveDailyBudget(dayKey: string, amountUsd: number): Promise<boolean> {
  const rounded = Number(amountUsd.toFixed(4));
  const db = await database();
  if (!db) {
    const current = memoryStore().dailyBudget.get(dayKey) ?? 0;
    if (current + rounded > DAILY_SPEND_LIMIT_USD) return false;
    memoryStore().dailyBudget.set(dayKey, current + rounded);
    return true;
  }

  const collection = db.collection<{ _id: string; authorizedUsd: number; updatedAt: Date }>('callDailyBudgets');
  await collection.updateOne(
    { _id: dayKey },
    { $setOnInsert: { authorizedUsd: 0 }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
  const result = await collection.findOneAndUpdate(
    { _id: dayKey, authorizedUsd: { $lte: DAILY_SPEND_LIMIT_USD - rounded } },
    { $inc: { authorizedUsd: rounded }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return Boolean(result);
}

export async function refundDailyBudget(dayKey: string, amountUsd: number): Promise<void> {
  const rounded = Number(amountUsd.toFixed(4));
  const db = await database();
  if (!db) {
    const current = memoryStore().dailyBudget.get(dayKey) ?? 0;
    memoryStore().dailyBudget.set(dayKey, Math.max(0, current - rounded));
    return;
  }
  await db.collection<{ _id: string; authorizedUsd: number; updatedAt: Date }>('callDailyBudgets').updateOne(
    { _id: dayKey },
    { $inc: { authorizedUsd: -rounded }, $set: { updatedAt: new Date() } },
  );
}

export async function releaseClaimForBudget(id: string, scheduledFor: Date): Promise<void> {
  const db = await database();
  if (!db) {
    const call = memoryStore().calls.find((item) => item.id === id);
    if (!call) return;
    call.status = 'scheduled';
    call.scheduledFor = scheduledFor;
    call.attempts = Math.max(0, call.attempts - 1);
    return;
  }
  await db.collection<StoredCallRequest>('callRequests').updateOne(
    { id, status: 'dialing' },
    { $set: { status: 'scheduled', scheduledFor }, $inc: { attempts: -1 } },
  );
}

export async function pauseSenatorQueue(senator: StoredCallRequest['senator'], reason: string): Promise<void> {
  const db = await database();
  if (!db) {
    memoryStore().pausedSenators.add(senator);
    return;
  }
  await db.collection('callQueuePauses').updateOne(
    { senator },
    { $set: { senator, paused: true, reason, updatedAt: new Date() } },
    { upsert: true },
  );
}

interface CreateCallOptions {
  moderationStatus: ModerationStatus;
  scheduledTimes: Array<Date | null>;
  authorizationDay: string;
}

export class DuplicateCallError extends Error {
  constructor() {
    super('This email already authorized a call to one of the selected senators today.');
  }
}

export async function createCallRequests(
  input: CallRequestInput,
  options: CreateCallOptions,
): Promise<StoredCallRequest[]> {
  const now = new Date();
  const purgeAt = new Date(now.getTime() + CALL_RECORD_TTL_DAYS * 24 * 60 * 60_000);
  const email = normalizeEmail(input.email);
  const records = input.senators.map((senator, index): StoredCallRequest => ({
    ...input,
    id: randomUUID(),
    email,
    senators: [...input.senators],
    senator,
    status: options.moderationStatus === 'auto_approved' ? 'scheduled' : 'pending_review',
    moderationStatus: options.moderationStatus,
    scheduledFor: options.scheduledTimes[index],
    authorizationDay: options.authorizationDay,
    createdAt: now,
    purgeAt,
    attempts: 0,
    retryDeadline: retryDeadlineFrom(now),
  }));
  const db = await database();

  if (!db) {
    const store = memoryStore();
    const duplicate = records.some((record) =>
      store.calls.some((existing) =>
        existing.email === email &&
        existing.senator === record.senator &&
        existing.authorizationDay === record.authorizationDay,
      ),
    );
    if (duplicate) throw new DuplicateCallError();
    store.calls.push(...records);
    return records;
  }

  try {
    await db.collection<StoredCallRequest>('callRequests').insertMany(records, { ordered: true });
    return records;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new DuplicateCallError();
    }
    throw error;
  }
}
