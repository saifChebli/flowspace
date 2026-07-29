import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { io } from '../../server';
import { logActivity } from '../../events/activity';
import type { CreateTaskInput, UpdateTaskInput, MoveTaskInput } from '../boards/schema';
import type { TimeEntryInput } from './schema';

import type { TaskStatus } from '@prisma/client';

/** Derive a TaskStatus from a destination list's name (best-effort). */
function statusFromListName(name: string): TaskStatus | null {
  const n = name.toLowerCase();
  if (/\b(done|complete|completed|shipped)\b/.test(n)) return 'DONE';
  if (/\breview\b/.test(n)) return 'REVIEW';
  if (/\b(in[\s-]?progress|doing|wip)\b/.test(n)) return 'IN_PROGRESS';
  if (/\b(to[\s-]?do|todo|backlog|new)\b/.test(n)) return 'TODO';
  return null;
}

export async function createTask(listId: string, userId: string, input: CreateTaskInput) {
  const list = await prisma.boardList.findUnique({ where: { id: listId }, include: { board: true } });
  if (!list) throw new AppError(404, 'List not found');

  await assertTeamMember(list.board.projectId, userId);

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

  io.to(`project:${list.board.projectId}`).emit('task:updated');

  await logActivity({
    projectId: list.board.projectId,
    actorId: userId,
    type: 'TASK_CREATED',
    meta: { taskId: task.id, taskTitle: task.title },
  });

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
  if (!task || task.deletedAt) throw new AppError(404, 'Task not found');
  await assertProjectMember(task.list.board.projectId, userId);
  return task;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertTeamMember(task.list.board.projectId, userId);

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

  io.to(`project:${task.list.board.projectId}`).emit('task:updated');

  return updated;
}

export async function moveTask(taskId: string, userId: string, input: MoveTaskInput) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  const projectId = task.list.board.projectId;
  await assertTeamMember(projectId, userId);

  // Resolve the destination list to auto-update status when appropriate.
  const targetList = await prisma.boardList.findUnique({
    where: { id: input.listId },
    include: { board: true },
  });
  if (!targetList) throw new AppError(404, 'Target list not found');

  // The destination must be in the SAME project. Membership was only checked
  // against the source, so without this a harvested list id moved a task onto
  // another tenant's board.
  if (targetList.board.projectId !== projectId) {
    throw new AppError(403, 'Cannot move a task to another project');
  }

  const derivedStatus = statusFromListName(targetList.name);
  const data: { listId: string; position: number; status?: TaskStatus; completedAt?: Date | null } = {
    listId: input.listId,
    position: input.position,
  };
  if (derivedStatus) {
    data.status = derivedStatus;
    if (derivedStatus === 'DONE') {
      data.completedAt = task.completedAt ?? new Date();
    } else if (task.completedAt) {
      data.completedAt = null; // moved out of Done
    }
  }

  const updated = await prisma.task.update({ where: { id: taskId }, data });

  io.to(`project:${projectId}`).emit('task:moved', { taskId, listId: input.listId, position: input.position });

  await logActivity({
    projectId,
    actorId: userId,
    type: derivedStatus === 'DONE' ? 'TASK_COMPLETED' : 'TASK_MOVED',
    clientVisible: derivedStatus === 'DONE',
    meta: { taskId, taskTitle: task.title, listName: targetList.name },
  });

  return updated;
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertTeamMember(task.list.board.projectId, userId);

  // Soft delete — never hard delete (PRD).
  await prisma.task.update({ where: { id: taskId }, data: { deletedAt: new Date() } });
  io.to(`project:${task.list.board.projectId}`).emit('task:updated');
  return { message: 'Task deleted' };
}

export async function addComment(taskId: string, authorId: string, body: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { list: { include: { board: true } } } });
  if (!task) throw new AppError(404, 'Task not found');
  await assertTeamMember(task.list.board.projectId, authorId);

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
  await assertTeamMember(task.list.board.projectId, userId);

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

async function assertTeamMember(projectId: string, userId: string) {
  const member = await assertProjectMember(projectId, userId);
  if (member.role === 'CLIENT') throw new AppError(403, 'Clients cannot modify task data');
  return member;
}
