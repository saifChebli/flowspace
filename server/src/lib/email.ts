import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

const transportConfig: SMTPTransport.Options | { jsonTransport: true } = env.SMTP_HOST
  ? {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      connectionTimeout: 10000, // fail fast instead of hanging if SMTP is unreachable
      greetingTimeout: 10000,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    }
  : { jsonTransport: true };

const transporter = nodemailer.createTransport(transportConfig as SMTPTransport.Options);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (env.NODE_ENV === 'development' && !env.SMTP_HOST) {
    console.log(`[Email - DEV] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

/* ── Base layout ─────────────────────────────────────────────────────────── */

function baseLayout(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CollabSpace</title>
  <!--[if mso]>
  <style>table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0;padding:0;width:100%!important;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
    a{color:#0f766e}
    @media only screen and (max-width:600px){
      .container{width:100%!important;padding:16px!important}
      .btn{width:100%!important;text-align:center!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <span style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 0;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:18px;height:18px;border-radius:5px;background:#0f766e;opacity:0.85;" width="18" height="18"></td>
                  <td style="width:8px;" width="8"></td>
                  <td style="font-size:15px;font-weight:700;color:#18181b;letter-spacing:-0.01em;">CollabSpace</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e4e4e7;background:#fafafa;">
              <p style="margin:0;font-size:12px;line-height:18px;color:#a1a1aa;">
                &copy; ${new Date().getFullYear()} CollabSpace. All rights reserved.
              </p>
              <p style="margin:8px 0 0;font-size:11px;line-height:16px;color:#a1a1aa;">
                You received this email because an action was triggered on your CollabSpace account. If you believe this was sent in error, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:8px;background:#0f766e;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" fillcolor="#0f766e">
      <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:600;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <a href="${url}" class="btn" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background:#0f766e;mso-hide:all;">${label}</a>
    </td>
  </tr>
</table>`;
}

/* ── Templates ───────────────────────────────────────────────────────────── */

export function verifyEmailTemplate(name: string, verifyUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Welcome to CollabSpace!</h1>
    <p style="margin:0 0 4px;font-size:15px;line-height:24px;color:#3f3f46;">Hi ${name},</p>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      Thanks for signing up. Please verify your email address to activate your account and get started.
    </p>
    ${ctaButton('Verify Email Address', verifyUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;word-break:break-all;">
      Or copy and paste this URL: ${verifyUrl}
    </p>`;
  return baseLayout('Verify your email to get started with CollabSpace', body);
}

export function passwordResetTemplate(name: string, resetUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Reset Your Password</h1>
    <p style="margin:0 0 4px;font-size:15px;line-height:24px;color:#3f3f46;">Hi ${name},</p>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      We received a request to reset the password for your CollabSpace account. Click the button below to choose a new password.
    </p>
    ${ctaButton('Reset Password', resetUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, no action is needed — your account is safe.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;word-break:break-all;">
      Or copy and paste this URL: ${resetUrl}
    </p>`;
  return baseLayout('Reset your CollabSpace password', body);
}

export function inviteEmailTemplate(
  inviterName: string,
  workspaceName: string,
  inviteUrl: string,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You're Invited!</h1>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on CollabSpace.
    </p>
    <p style="margin:8px 0 0;font-size:15px;line-height:24px;color:#3f3f46;">
      Accept the invitation to start collaborating with the team.
    </p>
    ${ctaButton('Accept Invitation', inviteUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      This invitation expires in <strong>7 days</strong>. If you don't recognise the sender, you can safely ignore this email.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;word-break:break-all;">
      Or copy and paste this URL: ${inviteUrl}
    </p>`;
  return baseLayout(`${inviterName} invited you to ${workspaceName}`, body);
}

export function clientInviteEmailTemplate(
  inviterName: string,
  projectName: string,
  portalUrl: string,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You've been added to ${projectName}</h1>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      <strong>${inviterName}</strong> has invited you to follow the <strong>${projectName}</strong> project on CollabSpace.
    </p>
    <p style="margin:8px 0 0;font-size:15px;line-height:24px;color:#3f3f46;">
      Open your client portal to see progress, files, and updates — <strong>no account or password needed</strong>.
    </p>
    ${ctaButton('Open Your Portal', portalUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      This link expires in <strong>7 days</strong>. If you don't recognise the sender, you can safely ignore this email.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;word-break:break-all;">
      Or copy and paste this URL: ${portalUrl}
    </p>`;
  return baseLayout(`${inviterName} invited you to ${projectName}`, body);
}

export function digestEmailTemplate(name: string, count: number, appUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Your CollabSpace summary</h1>
    <p style="margin:0 0 4px;font-size:15px;line-height:24px;color:#3f3f46;">Hi ${name},</p>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      You have <strong>${count}</strong> unread notification${count === 1 ? '' : 's'} waiting for you.
    </p>
    ${ctaButton('Open CollabSpace', appUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      You're receiving this daily summary because you have unread activity.
    </p>`;
  return baseLayout(`You have ${count} unread notification${count === 1 ? '' : 's'}`, body);
}

export function dueReminderEmailTemplate(
  name: string,
  taskTitle: string,
  projectName: string,
  dueLabel: string,
  appUrl: string,
): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Task due soon</h1>
    <p style="margin:0 0 4px;font-size:15px;line-height:24px;color:#3f3f46;">Hi ${name},</p>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      <strong>${taskTitle}</strong> in <strong>${projectName}</strong> is due <strong>${dueLabel}</strong>.
    </p>
    ${ctaButton('View Task', appUrl)}`;
  return baseLayout(`Task due soon: ${taskTitle}`, body);
}

export function magicLinkEmailTemplate(projectName: string, magicUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Your Portal Access</h1>
    <p style="margin:0;font-size:15px;line-height:24px;color:#3f3f46;">
      Click below to access the <strong>${projectName}</strong> client portal. No password required.
    </p>
    ${ctaButton('Open Portal', magicUrl)}
    <p style="margin:0;font-size:13px;line-height:20px;color:#71717a;">
      This link gives you access for <strong>90 days</strong>. Bookmark it for quick access.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#a1a1aa;word-break:break-all;">
      Or copy and paste this URL: ${magicUrl}
    </p>`;
  return baseLayout(`Portal access for ${projectName}`, body);
}
