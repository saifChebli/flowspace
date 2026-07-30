import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateBoardInput, UpdateBoardInput, CreateListInput, UpdateListInput } from './schema';

export async function createBoard(projectId: string, userId: string, input: CreateBoardInput) {
  await assertTeamMember(projectId, userId);
  return prisma.board.create({ data: { projectId, ...input } });
}

export async function getBoards(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);
  return prisma.board.findMany({
    where: { projectId },
    include: {
      lists: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            where: { deletedAt: null },
            orderBy: { position: 'asc' },
            include: {
              assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function updateBoard(boardId: string, userId: string, input: UpdateBoardInput) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  await assertTeamMember(board.projectId, userId);
  return prisma.board.update({ where: { id: boardId }, data: input });
}

export async function deleteBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  await assertTeamMember(board.projectId, userId);
  await prisma.board.delete({ where: { id: boardId } });
  return { message: 'Board deleted' };
}

export async function createList(boardId: string, userId: string, input: CreateListInput) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  await assertTeamMember(board.projectId, userId);
  return prisma.boardList.create({ data: { boardId, ...input } });
}

export async function updateList(listId: string, userId: string, input: UpdateListInput) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');
  await assertTeamMember(list.board.projectId, userId);

  // Toggling the completion column has to re-settle the tasks already sitting in
  // it, or the board and the analytics disagree until each card is dragged again.
  const togglesDone = input.isDoneColumn !== undefined && input.isDoneColumn !== list.isDoneColumn;
  if (!togglesDone) {
    return prisma.boardList.update({ where: { id: listId }, data: input });
  }

  const nowDone = input.isDoneColumn === true;
  const [updated] = await prisma.$transaction([
    prisma.boardList.update({ where: { id: listId }, data: input }),
    prisma.task.updateMany({
      where: { listId, deletedAt: null },
      data: nowDone
        ? { status: 'DONE', completedAt: new Date() }
        : { status: 'TODO', completedAt: null },
    }),
  ]);
  return updated;
}

export async function deleteList(listId: string, userId: string) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');
  await assertTeamMember(list.board.projectId, userId);
  await prisma.boardList.delete({ where: { id: listId } });
  return { message: 'List deleted' };
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}

async function assertTeamMember(projectId: string, userId: string) {
  const member = await assertProjectMember(projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot modify board data');
  return member;
}
