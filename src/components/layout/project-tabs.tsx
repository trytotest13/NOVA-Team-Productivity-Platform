'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { segment: 'board', label: 'Board' },
  { segment: 'list', label: 'List' },
  { segment: 'activity', label: 'Activity' },
  { segment: 'settings', label: 'Settings' },
] as const;

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-slate-200" aria-label="Project sections">
      {TABS.map((tab) => {
        const href = `/projects/${projectId}/${tab.segment}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.segment}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
              active
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
