import 'server-only';

import type { ActivityType, Prisma, PrismaClient } from '@prisma/client';

type PrismaLike = Prisma.TransactionClient | PrismaClient;

/** Writes an activity row using the provided client so it joins the caller's transaction. */
export async function logActivity(
  client: PrismaLike,
  entry: {
    projectId: string;
    actorId: string;
    taskId?: string | null;
    type: ActivityType;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  await client.activity.create({
    data: {
      projectId: entry.projectId,
      actorId: entry.actorId,
      taskId: entry.taskId ?? undefined,
      type: entry.type,
      metadata: entry.metadata ?? {},
    },
  });
}
