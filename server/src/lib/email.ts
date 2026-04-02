import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (env.NODE_ENV === 'development' && !env.RESEND_API_KEY) {
    console.log(`[Email - DEV] To: ${to}, Subject: ${subject}`);
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  return `
    <h2>Welcome to CollabSpace, ${name}!</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">
      Verify Email
    </a>
    <p>This link expires in 24 hours.</p>
  `;
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  return `
    <h2>Password Reset — CollabSpace</h2>
    <p>Hi ${name}, click below to reset your password:</p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">
      Reset Password
    </a>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
  `;
}

export function inviteEmailTemplate(
  inviterName: string,
  workspaceName: string,
  inviteUrl: string
): string {
  return `
    <h2>You're invited to join ${workspaceName} on CollabSpace</h2>
    <p>${inviterName} has invited you to collaborate.</p>
    <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">
      Accept Invite
    </a>
    <p>This invite expires in 7 days.</p>
  `;
}
