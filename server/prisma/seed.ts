import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@collabspace.io' },
    update: {},
    create: {
      email: 'admin@collabspace.io',
      name: 'Alex Admin',
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

  console.log('✅ Seed complete');
  console.log(`   Admin: admin@collabspace.io / Password123!`);
  console.log(`   Workspace slug: acme-co`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
