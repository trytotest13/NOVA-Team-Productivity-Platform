import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { AppShell } from '@/components/layout/app-shell';
import { authOptions } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  return (
    <AppShell user={{ id: session.user.id, name: session.user.name, image: session.user.image }}>
      {children}
    </AppShell>
  );
}
