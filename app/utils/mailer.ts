import { Resend } from 'resend';

const FROM = 'CA for Palestine <noreply@ca-for-palestine.com>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ca-for-palestine.com';

function getResend() {
    return new Resend(process.env.RESEND_API_KEY);
}

export async function sendConfirmationEmail(
    toEmail: string,
    firstName: string,
    rep: string,
    verifyToken: string,
    unsubscribeToken: string
): Promise<void> {
    const confirmUrl = `${BASE_URL}/verify-subscription?token=${verifyToken}`;
    const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${unsubscribeToken}`;

    await getResend().emails.send({
        from: FROM,
        to: toEmail,
        subject: 'Confirm your recurring emails to your representative',
        html: `
            <p>Hi ${firstName},</p>
            <p>You signed up to have your email to <strong>${rep}</strong> automatically re-sent a few times per week.</p>
            <p><strong><a href="${confirmUrl}">Click here to confirm your recurring sends</a></strong></p>
            <p>If you did not sign up for this, you can ignore this email. Unverified subscriptions are automatically deleted after 24 hours.</p>
            <p>To cancel at any time, use this link:<br/><a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
            <p>Save that unsubscribe link somewhere safe.</p>
        `,
    });
}

export async function sendReceiptEmail(
    toEmail: string,
    firstName: string,
    rep: string,
    unsubscribeToken: string
): Promise<void> {
    const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${unsubscribeToken}`;

    await getResend().emails.send({
        from: FROM,
        to: toEmail,
        subject: `Your email to ${rep} was sent`,
        html: `
            <p>Hi ${firstName},</p>
            <p>Your recurring email to <strong>${rep}</strong> was just submitted automatically.</p>
            <p>Keep the pressure up — your voice matters.</p>
            <p>To stop receiving these automated sends:<br/><a href="${unsubscribeUrl}">Unsubscribe</a></p>
        `,
    });
}
