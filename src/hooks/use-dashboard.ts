import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiFetch } from '@/lib/http';
import type { DashboardData } from '@/types/api';

export function useDashboard(): UseQueryResult<DashboardData> {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<DashboardData>('/api/me/dashboard'),
  });
}
