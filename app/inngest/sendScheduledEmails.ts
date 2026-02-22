import { inngest } from './client';
import { getDueSubscribers, updateAfterSend } from '../utils/subscribers';
import { sendReceiptEmail } from '../utils/mailer';
import type { Subscriber, UserInfo } from '../types/main';

// After Inngest JSON-serializes step results, ObjectId becomes a string
type SerializedSubscriber = Omit<Subscriber, '_id' | 'lastSentAt' | 'nextSendAt' | 'createdAt'> & {
    _id?: string;
    lastSentAt: string | null;
    nextSendAt: string;
    createdAt: string;
    userInfo: UserInfo;
};

export const sendScheduledEmails = inngest.createFunction(
    { id: 'send-scheduled-emails', timeouts: { finish: '2h' } },
    { event: 'app/send-scheduled-emails' },
    async ({ step }) => {
        const subscribers: SerializedSubscriber[] = await step.run('fetch-due-subscribers', async () => {
            return getDueSubscribers();
        });

        for (const subscriber of subscribers) {
            const subId = subscriber._id!;
            await step.run(`send-email-${subId}`, async () => {
                const { contactSchiff, contactPadilla } = await import('../utils/fillOutForms');
                const emailContent = {
                    subject: subscriber.emailSubject,
                    body: subscriber.emailBody,
                    representative: subscriber.rep === 'Schiff'
                        ? 'Senator Adam Schiff' as const
                        : 'Senator Alex Padilla' as const,
                };

                if (subscriber.rep === 'Schiff') {
                    await contactSchiff(emailContent, subscriber.userInfo, { dev: false });
                } else {
                    await contactPadilla(emailContent, subscriber.userInfo, { dev: false });
                }

                await updateAfterSend(subId, subscriber.sendsPerWeek);

                await sendReceiptEmail(
                    subscriber.userInfo.email,
                    subscriber.userInfo.firstName,
                    subscriber.rep === 'Schiff' ? 'Senator Adam Schiff' : 'Senator Alex Padilla',
                    subscriber.unsubscribeToken
                );
            });
        }

        return { processed: subscribers.length };
    }
);
