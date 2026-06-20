type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
      <section className="overflow-hidden rounded-[32px] border border-white/75 bg-white/72 shadow-soft backdrop-blur">
        <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1.08fr_0.92fr]">{children}</div>
      </section>
    </main>
  );
}
