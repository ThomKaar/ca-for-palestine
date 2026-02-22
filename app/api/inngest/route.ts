import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { sendScheduledEmails } from '@/inngest/sendScheduledEmails';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [sendScheduledEmails],
});
