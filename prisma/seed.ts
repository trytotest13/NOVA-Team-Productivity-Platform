import { hashSync } from 'bcryptjs';
import {
  ActivityType,
  MemberRole,
  PrismaClient,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  type Prisma,
} from '@prisma/client';

/**
 * Idempotent seed per schema.md §6. Run twice — same end state, no duplicates.
 * Demo password comes from SEED_DEMO_PASSWORD (never hardcoded here).
 */
const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@nova.app';
const MARCUS_EMAIL = 'marcus@nova.app';

function d(offsetDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(17, 0, 0, 0);
  return date;
}

function col(position: number): number {
  return (position + 1) * 500;
}

async function recreateProject(name: string, ownerEmail: string): Promise<void> {
  const existing = await prisma.project.findFirst({
    where: { name, owner: { email: ownerEmail } },
    select: { id: true },
  });
  if (existing) {
    await prisma.project.delete({ where: { id: existing.id } });
  }
}

function taskIdOf(map: Map<string, string>, title: string): string {
  const id = map.get(title);
  if (!id) throw new Error(`Seed bug: task "${title}" was not created`);
  return id;
}

async function main(): Promise<void> {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error('SEED_DEMO_PASSWORD is not set — copy .env.example to .env and fill it in.');
  }
  const passwordHash = hashSync(demoPassword, 10);

  const priya = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: 'Priya Sharma' },
    create: { email: DEMO_EMAIL, name: 'Priya Sharma', passwordHash },
  });
  const marcus = await prisma.user.upsert({
    where: { email: MARCUS_EMAIL },
    update: { passwordHash, name: 'Marcus Chen' },
    create: { email: MARCUS_EMAIL, name: 'Marcus Chen', passwordHash },
  });

  // ── Website Relaunch (Priya owner, both members) ──────────────────────────
  await recreateProject('Website Relaunch', DEMO_EMAIL);
  const website = await prisma.project.create({
    data: {
      name: 'Website Relaunch',
      description: 'Modern marketing site refresh: new hero, pricing page and blog migration.',
      color: '#4F46E5',
      status: ProjectStatus.ACTIVE,
      dueDate: d(21),
      ownerId: priya.id,
      members: {
        create: [
          { userId: priya.id, role: MemberRole.OWNER },
          { userId: marcus.id, role: MemberRole.MEMBER },
        ],
      },
    },
    select: { id: true },
  });

  type SeedTask = {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string;
    position: number;
    dueDate?: Date;
    completedAt?: Date;
    description?: string;
  };

  const websiteTasks: SeedTask[] = [
    {
      title: 'Write homepage copy',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: marcus.id,
      position: col(0),
      dueDate: d(5),
    },
    {
      title: 'Design pricing page',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeId: priya.id,
      position: col(1),
      dueDate: d(7),
    },
    {
      title: 'Set up analytics',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeId: marcus.id,
      position: col(2),
    },
    {
      title: 'Fix contact form validation',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      assigneeId: marcus.id,
      position: col(3),
      dueDate: d(-2),
      description: 'Email field accepts invalid formats and the error state is not announced.',
    },
    {
      title: 'Design landing page hero',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: priya.id,
      position: col(0),
      dueDate: d(2),
      description: 'Two visual directions: gradient-forward and illustration-led.',
    },
    {
      title: 'Implement responsive nav',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      assigneeId: marcus.id,
      position: col(1),
      dueDate: d(4),
    },
    {
      title: 'Draft launch email',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.LOW,
      assigneeId: priya.id,
      position: col(2),
    },
    {
      title: 'Migrate blog content',
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      assigneeId: marcus.id,
      position: col(0),
    },
    {
      title: 'Choose tech stack',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeId: priya.id,
      position: col(0),
      completedAt: d(-3),
    },
    {
      title: 'Register domain',
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      assigneeId: marcus.id,
      position: col(1),
      completedAt: d(-10),
    },
  ];

  const createdTasks = await prisma.$transaction(
    websiteTasks.map((task) =>
      prisma.task.create({
        data: { ...task, projectId: website.id, creatorId: priya.id },
        select: { id: true, title: true },
      }),
    ),
  );
  const taskByTitle = new Map(createdTasks.map((task) => [task.title, task.id]));

  await prisma.comment.createMany({
    data: [
      {
        taskId: taskIdOf(taskByTitle, 'Design landing page hero'),
        authorId: priya.id,
        body: 'Hero concept v2 uploaded — thoughts?',
      },
      {
        taskId: taskIdOf(taskByTitle, 'Design landing page hero'),
        authorId: marcus.id,
        body: 'Love the gradient direction. Can we try a lighter CTA button?',
      },
      {
        taskId: taskIdOf(taskByTitle, 'Fix contact form validation'),
        authorId: priya.id,
        body: 'This is blocking the beta list — priority bump.',
      },
      {
        taskId: taskIdOf(taskByTitle, 'Choose tech stack'),
        authorId: marcus.id,
        body: 'Next.js + Prisma has been a great call so far.',
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        projectId: website.id,
        actorId: priya.id,
        type: ActivityType.PROJECT_CREATED,
        metadata: { projectName: 'Website Relaunch' },
      },
      {
        projectId: website.id,
        actorId: priya.id,
        type: ActivityType.MEMBER_ADDED,
        metadata: { memberName: 'Marcus Chen' },
      },
      {
        projectId: website.id,
        actorId: priya.id,
        taskId: taskIdOf(taskByTitle, 'Design landing page hero'),
        type: ActivityType.TASK_CREATED,
        metadata: { taskTitle: 'Design landing page hero' },
      },
      {
        projectId: website.id,
        actorId: priya.id,
        taskId: taskIdOf(taskByTitle, 'Design landing page hero'),
        type: ActivityType.TASK_ASSIGNED,
        metadata: { taskTitle: 'Design landing page hero', assigneeName: 'Priya Sharma' },
      },
      {
        projectId: website.id,
        actorId: marcus.id,
        taskId: taskIdOf(taskByTitle, 'Design landing page hero'),
        type: ActivityType.COMMENT_ADDED,
        metadata: { taskTitle: 'Design landing page hero' },
      },
      {
        projectId: website.id,
        actorId: priya.id,
        taskId: taskIdOf(taskByTitle, 'Choose tech stack'),
        type: ActivityType.TASK_COMPLETED,
        metadata: { taskTitle: 'Choose tech stack', from: 'IN_REVIEW', to: 'DONE' },
      },
    ],
  });

  // ── Mobile App MVP (Marcus only — data isolation demo) ────────────────────
  await recreateProject('Mobile App MVP', MARCUS_EMAIL);
  const mobile = await prisma.project.create({
    data: {
      name: 'Mobile App MVP',
      description: 'Companion mobile app scope for the fall release.',
      color: '#0EA5E9',
      status: ProjectStatus.ACTIVE,
      dueDate: d(35),
      ownerId: marcus.id,
      members: { create: [{ userId: marcus.id, role: MemberRole.OWNER }] },
    },
    select: { id: true },
  });

  const mobileTasks: Array<Prisma.TaskCreateManyInput> = [
    {
      projectId: mobile.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
      title: 'Define MVP scope',
      priority: TaskPriority.HIGH,
      position: col(0),
      dueDate: d(10),
    },
    {
      projectId: mobile.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
      title: 'Onboarding wireframes',
      priority: TaskPriority.MEDIUM,
      position: col(1),
      dueDate: d(8),
    },
    {
      projectId: mobile.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
      title: 'Spike: offline storage',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      position: col(0),
    },
    {
      projectId: mobile.id,
      creatorId: marcus.id,
      assigneeId: marcus.id,
      title: 'Set up CI pipeline',
      priority: TaskPriority.LOW,
      status: TaskStatus.DONE,
      position: col(0),
      completedAt: d(-1),
    },
  ];
  await prisma.task.createMany({ data: mobileTasks });

  await prisma.activity.createMany({
    data: [
      {
        projectId: mobile.id,
        actorId: marcus.id,
        type: ActivityType.PROJECT_CREATED,
        metadata: { projectName: 'Mobile App MVP' },
      },
    ],
  });

  // ── Q1 Offsite (archived — archive filtering demo) ────────────────────────
  await recreateProject('Q1 Offsite', DEMO_EMAIL);
  await prisma.project.create({
    data: {
      name: 'Q1 Offsite',
      description: 'Team offsite planning — wrapped up.',
      color: '#10B981',
      status: ProjectStatus.ARCHIVED,
      ownerId: priya.id,
      members: { create: [{ userId: priya.id, role: MemberRole.OWNER }] },
    },
    select: { id: true },
  });

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    comments: await prisma.comment.count(),
    activities: await prisma.activity.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
