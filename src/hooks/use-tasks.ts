import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/http';
import type { CommentItem, TaskFilters, TaskItem, TaskStatus } from '@/types/api';

export function taskListKey(projectId: string, filters?: TaskFilters): readonly unknown[] {
  return ['tasks', projectId, filters ?? {}] as const;
}

export function useProjectTasks(
  projectId: string,
  filters?: TaskFilters,
): UseQueryResult<TaskItem[]> {
  const search = new URLSearchParams();
  if (filters?.status) search.set('status', filters.status);
  if (filters?.priority) search.set('priority', filters.priority);
  if (filters?.assigneeId) search.set('assigneeId', filters.assigneeId);
  if (filters?.q) search.set('q', filters.q);
  const query = search.toString();

  return useQuery({
    queryKey: taskListKey(projectId, filters),
    queryFn: () =>
      apiFetch<TaskItem[]>(`/api/projects/${projectId}/tasks${query ? `?${query}` : ''}`),
    enabled: Boolean(projectId),
  });
}

export interface CreateTaskValues {
  title: string;
  status: TaskStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  dueDate?: string;
}

export function useCreateTask(
  projectId: string,
): UseMutationResult<TaskItem, Error, CreateTaskValues> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateTaskValues) =>
      apiFetch<TaskItem>(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}

export interface UpdateTaskValues {
  title?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string | null;
  dueDate?: string | null;
  status?: TaskStatus;
}

export function useUpdateTask(
  projectId: string,
): UseMutationResult<TaskItem, Error, { taskId: string; values: UpdateTaskValues }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, values }: { taskId: string; values: UpdateTaskValues }) =>
      apiFetch<TaskItem>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}

export function useReorderTasks(
  projectId: string,
): UseMutationResult<
  { reordered: number },
  Error,
  { taskId: string; status: TaskStatus; taskIds: string[] }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      taskIds,
    }: {
      taskId: string;
      status: TaskStatus;
      taskIds: string[];
    }) =>
      apiFetch<{ reordered: number }>(`/api/tasks/${taskId}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ status, taskIds }),
      }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}

export function useDeleteTask(
  projectId: string,
): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<{ deleted: boolean }>(`/api/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}

export function useTaskComments(taskId: string | null): UseQueryResult<CommentItem[]> {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => apiFetch<CommentItem[]>(`/api/tasks/${taskId as string}/comments`),
    enabled: Boolean(taskId),
  });
}

export function useAddComment(
  taskId: string | null,
  projectId: string,
): UseMutationResult<CommentItem, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiFetch<CommentItem>(`/api/tasks/${taskId as string}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: (comment) => {
      void queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      void queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
      return comment;
    },
  });
}

export function useDeleteComment(
  taskId: string | null,
  projectId: string,
): UseMutationResult<{ deleted: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      apiFetch<{ deleted: boolean }>(`/api/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      void queryClient.invalidateQueries({ queryKey: ['activity', projectId] });
    },
  });
}
