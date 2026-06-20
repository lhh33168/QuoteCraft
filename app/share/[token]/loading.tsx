export default function SharePageLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,125,104,0.14),_transparent_36%),linear-gradient(180deg,#f6f1e8_0%,#f8f6f0_45%,#ffffff_100%)]">
      <div className="app-safe-top sticky top-0 z-20 border-b border-black/6 bg-[#f7faf7] shadow-[0_10px_24px_rgba(19,33,29,0.05)]">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="h-10 w-10 animate-pulse rounded-[18px] bg-white shadow-[0_8px_20px_rgba(19,33,29,0.05)]" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-20 animate-pulse rounded-full bg-pine/10" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded-full bg-black/8" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-8">
        <section className="flex-1 rounded-[32px] border border-black/5 bg-[#fffdfa] p-6 shadow-soft sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-pine/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            正在打开示例方案
          </div>
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded-[20px] bg-black/6" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-black/6" />
            <div className="h-4 w-11/12 animate-pulse rounded-full bg-black/6" />
            <div className="h-4 w-8/12 animate-pulse rounded-full bg-black/6" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="rounded-[24px] border border-black/6 bg-[#fcfaf5] p-4" key={index}>
                <div className="h-3 w-20 animate-pulse rounded-full bg-black/6" />
                <div className="mt-3 h-6 w-28 animate-pulse rounded-full bg-black/8" />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4 border-t border-black/8 pt-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="space-y-3" key={index}>
                <div className="h-3 w-24 animate-pulse rounded-full bg-pine/10" />
                <div className="h-4 w-full animate-pulse rounded-full bg-black/6" />
                <div className="h-4 w-10/12 animate-pulse rounded-full bg-black/6" />
              </div>
            ))}
          </div>
        </section>

        <aside className="hidden w-[320px] shrink-0 rounded-[28px] border border-black/5 bg-white p-6 shadow-soft lg:block">
          <div className="h-3 w-20 animate-pulse rounded-full bg-pine/10" />
          <div className="mt-4 h-8 w-40 animate-pulse rounded-[16px] bg-black/8" />
          <div className="mt-6 space-y-3">
            <div className="h-12 w-full animate-pulse rounded-full bg-black/6" />
            <div className="h-12 w-full animate-pulse rounded-full bg-black/6" />
            <div className="h-12 w-full animate-pulse rounded-full bg-black/6" />
          </div>
        </aside>
      </div>
    </main>
  );
}
