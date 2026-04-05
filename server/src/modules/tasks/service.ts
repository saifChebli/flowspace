import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { io } from '../../server';
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '../boards/schema';
import type { TimeEntryInput } from './schema';

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
    const recipients = assigneeIds.filter((uid) => uid !== userId);
    if (recipients.length) {
      await prisma.notification.createMany({
        data: recipients.map((uid) => ({
          recipientId: uid,
          actorId: userId,
          type: 'TASK_ASSIGNED' as const,
          taskId: task.id,
        })),
      });
      for (const rid of recipients) {
        io.to(`user:${rid}`).emit('notification:new');
      }
    }
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
      timeEntries: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { date: 'desc' } },
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
    const recipients = assigneeIds.filter((uid) => uid !== userId);
    if (recipients.length) {
      await prisma.notification.createMany({
        data: recipients.map((uid) => ({
          recipientId: uid,
          actorId: userId,
          type: 'TASK_ASSIGNED' as const,
          taskId,
        })),
        skipDuplicates: true,
      });
      for (const rid of recipients) {
        io.to(`user:${rid}`).emit('notification:new');
      }
    }
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

export async function updateComment(commentId: string, userId: string, body: string) {
  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });
  if (!comment) throw new AppError(404, 'Comment not found');
  if (comment.authorId !== userId) throw new AppError(403, 'Cannot edit another user\'s comment');

  return prisma.taskComment.update({
    where: { id: commentId },
    data: { body, editedAt: new Date() },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });
  if (!comment) throw new AppError(404, 'Comment not found');
  if (comment.authorId !== userId) throw new AppError(403, 'Cannot delete another user\'s comment');

  await prisma.taskComment.delete({ where: { id: commentId } });
  return { message: 'Comment deleted' };
}

export async function addTimeEntry(taskId: string, userId: string, input: TimeEntryInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);

  return prisma.taskTimeEntry.create({
    data: {
      taskId,
      userId,
      minutes: input.minutes,
      note: input.note,
      date: input.date ? new Date(input.date) : new Date(),
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function deleteTimeEntry(entryId: string, userId: string) {
  const entry = await prisma.taskTimeEntry.findUnique({
    where: { id: entryId },
    include: { task: { include: { list: { include: { board: true } } } } },
  });
  if (!entry) throw new AppError(404, 'Time entry not found');
  if (entry.userId !== userId) throw new AppError(403, 'Cannot delete another user\'s time entry');

  await prisma.taskTimeEntry.delete({ where: { id: entryId } });
  return { message: 'Time entry deleted' };
}

async function assertProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw new AppError(403, 'Not a project member');
  return member;
}
