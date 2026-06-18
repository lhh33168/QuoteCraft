type AppShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function AppShell({ title, description, children, actions }: AppShellProps) {
  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-soft backdrop-blur">
        <header className="flex flex-col gap-5 border-b border-black/5 bg-white/60 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-pine/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pine">
              QuoteCraft App
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </header>
        <div className="p-6">{children}</div>
      </section>
    </main>
  );
}
