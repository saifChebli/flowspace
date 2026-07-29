import crypto from 'crypto';

/**
 * Invite tokens are bearer credentials — a CLIENT invite token alone mints a portal
 * session with no other proof — so they must be unguessable. The schema's
 * `@default(cuid())` is timestamp + counter + partly `Math.random`, i.e. predictable
 * from a sample; always pass an explicit token instead.
 */
export function newInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
