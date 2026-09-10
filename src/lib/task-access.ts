import 'server-only';

import type { Task } from '@prisma/client';

import { ApiRequestError, requireProjectMember } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export interface TaskAccess {
  task: Task;
  userId: string;
  isOwner: boolean;
}

/** Loads the task, then verifies the caller is a member of its project. */
export async function requireTaskAccess(taskId: string): Promise<TaskAccess> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new ApiRequestError('NOT_FOUND', 404, 'Task not found');

  const { user, isOwner } = await requireProjectMember(task.projectId);
  return { task, userId: user.id, isOwner };
}

/** Ensures the assignee is a member of the task's project. */
export async function assertAssigneeIsMember(projectId: string, assigneeId: string): Promise<void> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { id: true },
  });
  if (!member) {
    throw new ApiRequestError('VALIDATION_ERROR', 422, 'Assignee must be a member of the project');
  }
}
