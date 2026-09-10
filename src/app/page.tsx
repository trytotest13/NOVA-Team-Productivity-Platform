import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 md:px-6">
      <header className="flex h-16 items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-slate-900">NOVA</span>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          Plan. Collaborate. Deliver.
        </h1>
        <p className="max-w-xl text-base text-slate-600">
          NOVA is a project management platform for teams to manage projects, tasks, members and
          productivity from a single application.
        </p>
      </section>
    </main>
  );
}
