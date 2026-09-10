/**
 * Response shapes returned by the /api routes (see trd.md §4).
 * Dates arrive as ISO strings over JSON.
 */

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';
export type MemberRole = 'OWNER' | 'MEMBER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export interface UserSummary {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  dueDate: string | null;
  updatedAt: string;
  memberCount: number;
  members: UserSummary[];
  taskCount: number;
  doneCount: number;
  progress: number;
}

export interface MemberItem {
  role: MemberRole;
  joinedAt: string;
  user: UserSummary & { email: string | null };
}

export interface ProjectStats {
  total: number;
  done: number;
  progress: number;
  byStatus: Record<TaskStatus, number>;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  dueDate: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: MemberItem[];
  stats: ProjectStats;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assigneeId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: Pick<UserSummary, 'id' | 'name' | 'image'> | null;
  commentCount?: number;
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: Pick<UserSummary, 'id' | 'name' | 'image'>;
}

export type ActivityType =
  | 'PROJECT_CREATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'TASK_CREATED'
  | 'TASK_MOVED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  metadata: Record<string, string | undefined>;
  createdAt: string;
  actor: Pick<UserSummary, 'id' | 'name' | 'image'>;
  task: { id: string; title: string } | null;
}

export interface ActivityPage {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface DashboardData {
  openTasks: number;
  overdueCount: number;
  completedThisWeek: number;
  myTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    project: { id: string; name: string; color: string };
  }>;
  projects: Array<{
    id: string;
    name: string;
    color: string;
    total: number;
    done: number;
    progress: number;
  }>;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  q?: string;
}
