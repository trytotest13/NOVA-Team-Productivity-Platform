'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import type { UserSummary } from '@/types/api';

export function UserMenu({ user }: { user: UserSummary }) {
  const { logout } = useAuth();
  const router = useRouter();
  const name = user.name ?? user.email ?? 'Account';

  return (
    <DropdownMenu
      triggerLabel="Open account menu"
      trigger={
        <span className="flex items-center gap-2 rounded-lg py-1 pl-1">
          <Avatar name={name} src={user.image ?? undefined} />
          <span className="hidden max-w-24 truncate text-sm font-medium text-slate-700 lg:inline">
            {name}
          </span>
        </span>
      }
      items={[
        {
          label: 'Log out',
          destructive: true,
          onSelect: () => {
            logout();
            router.push('/');
          },
        },
      ]}
    />
  );
}
