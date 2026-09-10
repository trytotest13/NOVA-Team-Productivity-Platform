import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { apiFetch } from '@/lib/http';
import type {
  ActivityPage,
  MemberItem,
  ProjectDetail,
  ProjectListItem,
  UserSummary,
} from '@/types/api';

export function useProjects(includeArchived = false): UseQueryResult<ProjectListItem[]> {
  return useQuery({
    queryKey: ['projects', includeArchived],
    queryFn: () =>
      apiFetch<ProjectListItem[]>(`/api/projects${includeArchived ? '?includeArchived=true' : ''}`),
  });
}

export function useProject(projectId: string): UseQueryResult<ProjectDetail> {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiFetch<ProjectDetail>(`/api/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
}

export function useProjectMembers(projectId: string): UseQueryResult<MemberItem[]> {
  return useQuery({
    queryKey: ['members', projectId],
    queryFn: () => apiFetch<MemberItem[]>(`/api/projects/${projectId}/members`),
    enabled: Boolean(projectId),
  });
}

export function useProjectActivity(projectId: string): UseQueryResult<ActivityPage> {
  return useQuery({
    queryKey: ['activity', projectId],
    queryFn: () => apiFetch<ActivityPage>(`/api/projects/${projectId}/activity`),
    enabled: Boolean(projectId),
  });
}

export interface CreateProjectValues {
  name: string;
  description?: string;
  color: string;
  dueDate?: string;
}

export function useCreateProject(): UseMutationResult<ProjectDetail, Error, CreateProjectValues> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateProjectValues) =>
      apiFetch<ProjectDetail>('/api/projects', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export interface UpdateProjectValues {
  name?: string;
  description?: string | null;
  color?: string;
  dueDate?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export function useUpdateProject(
  projectId: string,
): UseMutationResult<ProjectDetail, Error, UpdateProjectValues> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateProjectValues) =>
      apiFetch<ProjectDetail>(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      }),
    onSuccess: (project) => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return project;
    },
  });
}

export function useDeleteProject(
  projectId: string,
): UseMutationResult<{ deleted: boolean }, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ deleted: boolean }>(`/api/projects/${projectId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddMember(
  projectId: string,
): UseMutationResult<MemberItem, Error, { email: string }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string }) =>
      apiFetch<MemberItem>(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['members', projectId] }),
  });
}

export function useRemoveMember(
  projectId: string,
): UseMutationResult<{ removed: boolean }, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ removed: boolean }>(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['members', projectId] }),
  });
}

export function useMyProjectsSummary(): UseQueryResult<ProjectListItem[]> {
  return useProjects(false);
}

export type { UserSummary };
