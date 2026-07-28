/**
 * Creates (or updates) the platform super-admin account from environment vars.
 * Nothing is hardcoded — run with:
 *   SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD='...' npm run seed:admin
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.error('❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.');
    console.error('   Example: SUPER_ADMIN_EMAIL=you@example.com SUPER_ADMIN_PASSWORD=... npm run seed:admin');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('❌ SUPER_ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, emailVerified: true, suspendedAt: null },
    create: { email, name, passwordHash, emailVerified: true },
    select: { id: true, email: true },
  });

  const allowlisted = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email);

  console.log(`✅ Super-admin ready: ${user.email}`);
  if (allowlisted) {
    console.log('   ADMIN_EMAILS already includes this address — /admin is unlocked.');
  } else {
    console.log('⚠️  Add this address to ADMIN_EMAILS in your .env, then restart the server:');
    console.log(`   ADMIN_EMAILS=${user.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
