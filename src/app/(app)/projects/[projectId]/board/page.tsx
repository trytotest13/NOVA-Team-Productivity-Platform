'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { KanbanBoard } from '@/components/board/kanban-board';
import { useBoardUi } from '@/stores/board-ui.store';
import { useProjectTasks } from '@/hooks/use-tasks';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const openTask = useBoardUi((state) => state.openTask);
  const deepLinkId = searchParams.get('task');

  const { data: tasks } = useProjectTasks(projectId);

  // Deep links (e.g. from the dashboard) open the drawer once the task exists in cache.
  useEffect(() => {
    if (deepLinkId && tasks?.some((task) => task.id === deepLinkId)) {
      openTask(deepLinkId);
      router.replace(`/projects/${projectId}/board`);
    }
  }, [deepLinkId, tasks, openTask, projectId, router]);

  return <KanbanBoard projectId={projectId} />;
}
