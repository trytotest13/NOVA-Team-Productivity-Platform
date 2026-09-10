'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Select } from '@/components/ui/select';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type MemberItem,
  type TaskFilters as TaskFiltersType,
} from '@/types/api';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

export function TaskFilters({ projectId, members }: { projectId: string; members: MemberItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/projects/${projectId}/list?${next.toString()}`);
  };

  const hasFilters = Boolean(
    params.get('status') || params.get('priority') || params.get('assigneeId') || params.get('q'),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setParam('q', search.trim());
        }}
        className="relative"
      >
        <Search
          className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="h-10 w-56 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        />
      </form>

      <Select
        aria-label="Filter by status"
        value={params.get('status') ?? ''}
        onChange={(event) => setParam('status', event.target.value)}
        className="w-40"
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by priority"
        value={params.get('priority') ?? ''}
        onChange={(event) => setParam('priority', event.target.value)}
        className="w-36"
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by assignee"
        value={params.get('assigneeId') ?? ''}
        onChange={(event) => setParam('assigneeId', event.target.value)}
        className="w-44"
      >
        <option value="">Anyone</option>
        {members.map((member) => (
          <option key={member.user.id} value={member.user.id}>
            {member.user.name ?? member.user.email}
          </option>
        ))}
      </Select>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            router.replace(`/projects/${projectId}/list`);
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Clear
        </button>
      ) : null}
    </div>
  );
}
