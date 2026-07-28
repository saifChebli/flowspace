import { randomBytes } from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// DEV/DEMO DATA ONLY — never run against production.
// The platform super-admin is created separately by `npm run seed:admin`
// (env-driven, no credentials in source).
async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_SEED) {
    console.error('❌ Refusing to run the demo seed in production. Set ALLOW_DEMO_SEED=1 to override.');
    process.exit(1);
  }

  console.log('🌱 Seeding demo data...');

  // Demo account. Password comes from env when provided, otherwise a random one
  // is generated and printed — so no usable credentials live in the repo.
  const demoPassword = process.env.DEMO_PASSWORD ?? randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'demo@collabspace.local' },
    update: {},
    create: {
      email: 'demo@collabspace.local',
      name: 'Demo User',
      passwordHash,
      emailVerified: true,
    },
  });

  // Create a workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-co' },
    update: {},
    create: {
      name: 'Acme Co',
      slug: 'acme-co',
      description: 'Demo workspace',
      members: {
        create: { userId: admin.id, role: 'ADMIN' },
      },
    },
  });

  // Create a project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-01' },
    update: {},
    create: {
      id: 'seed-project-01',
      workspaceId: workspace.id,
      name: 'Website Redesign',
      description: 'Redesign the company website',
      members: {
        create: { userId: admin.id, role: 'MEMBER' },
      },
    },
  });

  // Create default channels
  await prisma.channel.createMany({
    skipDuplicates: true,
    data: [
      { projectId: project.id, name: 'general', type: 'PUBLIC' },
      { projectId: project.id, name: 'client-updates', type: 'CLIENT_VISIBLE' },
    ],
  });

  // Create a board with default lists
  const board = await prisma.board.upsert({
    where: { id: 'seed-board-01' },
    update: {},
    create: {
      id: 'seed-board-01',
      projectId: project.id,
      name: 'Main Board',
    },
  });

  await prisma.boardList.createMany({
    skipDuplicates: true,
    data: [
      { boardId: board.id, name: 'Backlog', position: 0 },
      { boardId: board.id, name: 'In Progress', position: 1 },
      { boardId: board.id, name: 'Review', position: 2 },
      { boardId: board.id, name: 'Done', position: 3 },
    ],
  });

  console.log('✅ Demo seed complete');
  console.log(`   Demo login: demo@collabspace.local / ${demoPassword}`);
  console.log(`   Workspace slug: acme-co`);
  console.log('   (This account has no platform-admin rights — use `npm run seed:admin` for that.)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
