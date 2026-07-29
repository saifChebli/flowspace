import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { parseCsvRecords } from '../../lib/csvParse';
import { logActivity } from '../../events/activity';

/** Trello CSV exports vary a little; accept the common header spellings. */
function pick(rec: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) if (rec[k]) return rec[k];
  return '';
}

function parseDue(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertTeamMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot import data');
  return member;
}

export interface ImportResult {
  boardId: string;
  listsCreated: number;
  tasksCreated: number;
  skipped: number;
}

/**
 * Import a Trello board CSV into a new board on this project.
 * Cards map to tasks; the Trello "List" column becomes our BoardLists.
 */
export async function importTrelloCsv(
  projectId: string,
  userId: string,
  csv: string,
  boardName = 'Imported from Trello',
): Promise<ImportResult> {
  await assertTeamMember(projectId, userId);

  const records = parseCsvRecords(csv);
  if (records.length === 0) throw new AppError(400, 'That file has no rows we could read.');

  // Group cards by their Trello list, preserving first-seen order.
  const byList = new Map<string, Record<string, string>[]>();
  let skipped = 0;

  for (const rec of records) {
    const title = pick(rec, 'card name', 'name', 'title');
    if (!title) { skipped++; continue; }
    const listName = pick(rec, 'list name', 'list', 'column') || 'Imported';
    if (!byList.has(listName)) byList.set(listName, []);
    byList.get(listName)!.push(rec);
  }

  if (byList.size === 0) throw new AppError(400, 'No cards with a name were found in that file.');

  const board = await prisma.board.create({ data: { projectId, name: boardName } });

  let listsCreated = 0;
  let tasksCreated = 0;

  for (const [listName, cards] of byList) {
    const list = await prisma.boardList.create({
      data: { boardId: board.id, name: listName.slice(0, 100), position: listsCreated },
    });
    listsCreated++;

    const isDoneList = /\b(done|complete|completed|shipped)\b/i.test(listName);

    await prisma.task.createMany({
      data: cards.map((rec, i) => {
        const labels = pick(rec, 'labels', 'label')
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);
        const archived = pick(rec, 'archived').toLowerCase() === 'true';
        return {
          listId: list.id,
          title: pick(rec, 'card name', 'name', 'title').slice(0, 300),
          description: pick(rec, 'card description', 'description') || null,
          position: i,
          labels,
          status: isDoneList ? ('DONE' as const) : ('TODO' as const),
          completedAt: isDoneList ? new Date() : null,
          dueDate: parseDue(pick(rec, 'due date', 'due')),
          deletedAt: archived ? new Date() : null,
        };
      }),
    });
    tasksCreated += cards.length;
  }

  await logActivity({
    projectId,
    actorId: userId,
    type: 'TASK_CREATED',
    meta: { taskTitle: `${tasksCreated} cards imported from Trello` },
  });

  return { boardId: board.id, listsCreated, tasksCreated, skipped };
}
