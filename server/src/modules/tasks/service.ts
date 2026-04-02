import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '../boards/schema';

export async function createTask(listId: string, userId: string, input: CreateTaskInput) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');

  await assertProjectMember(list.board.projectId, userId);

  const { assigneeIds, ...taskData } = input;

  const task = await prisma.task.create({
    data: {
      listId,
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      assignees: assigneeIds?.length
        ? { createMany: { data: assigneeIds.map((uid) => ({ userId: uid })) } }
        : undefined,
    },
    include: { assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });

  // Notify new assignees
  if (assigneeIds?.length) {
    await prisma.notification.createMany({
      data: assigneeIds
        .filter((uid) => uid !== userId)
        .map((uid) => ({
          recipientId: uid,
          actorId: userId,
          type: 'TASK_ASSIGNED' as const,
          taskId: task.id,
        })),
    });
  }

  return task;
}

export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      list: { include: { board: true } },
      assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);
  return task;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);

  const { assigneeIds, ...taskData } = input;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      ...(assigneeIds !== undefined
        ? {
            assignees: {
              deleteMany: {},
              createMany: { data: assigneeIds.map((uid) => ({ userId: uid })) },
            },
          }
        : {}),
    },
    include: { assignees: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });

  // Notify newly assigned users
  if (assigneeIds?.length) {
    await prisma.notification.createMany({
      data: assigneeIds
        .filter((uid) => uid !== userId)
        .map((uid) => ({
          recipientId: uid,
          actorId: userId,
          type: 'TASK_ASSIGNED' as const,
          taskId,
        })),
      skipDuplicates: true,
    });
  }

  return updated;
}

export async function moveTask(taskId: string, userId: string, input: MoveTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);

  return prisma.task.update({
    where: { id: taskId },
    data: { listId: input.listId, position: input.position },
  });
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);

  await prisma.task.delete({ where: { id: taskId } });
  return { message: 'Task deleted' };
}

export async function addComment(taskId: string, authorId: string, body: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, authorId);

  return prisma.taskComment.create({
    data: { taskId, authorId, body },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}
