import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateBoardInput, UpdateBoardInput, CreateListInput, UpdateListInput } from './schema';

export async function createBoard(projectId: string, userId: string, input: CreateBoardInput) {
  await assertProjectMember(projectId, userId);
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
  await assertProjectMember(board.projectId, userId);
  return prisma.board.update({ where: { id: boardId }, data: input });
}

export async function deleteBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  await assertProjectMember(board.projectId, userId);
  await prisma.board.delete({ where: { id: boardId } });
  return { message: 'Board deleted' };
}

export async function createList(boardId: string, userId: string, input: CreateListInput) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, 'Board not found');
  await assertProjectMember(board.projectId, userId);
  return prisma.boardList.create({ data: { boardId, ...input } });
}

export async function updateList(listId: string, userId: string, input: UpdateListInput) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');
  await assertProjectMember(list.board.projectId, userId);
  return prisma.boardList.update({ where: { id: listId }, data: input });
}

export async function deleteList(listId: string, userId: string) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');
  await assertProjectMember(list.board.projectId, userId);
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
