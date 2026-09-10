import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'NOVA — Plan. Collaborate. Deliver.',
  description:
    'NOVA is a project management platform for teams to manage projects, tasks, members and productivity from a single application.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
