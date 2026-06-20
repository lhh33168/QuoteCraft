export default function SharePageLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,125,104,0.14),_transparent_36%),linear-gradient(180deg,#f6f1e8_0%,#f8f6f0_45%,#ffffff_100%)]">
      <div className="app-safe-top app-top-bar app-top-bar-compact sticky top-0 z-20">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 py-3 sm:grid-cols-[48px_minmax(0,1fr)_48px]">
            <div className="h-11 w-11 animate-pulse rounded-full bg-white/90 shadow-[0_6px_16px_rgba(19,33,29,0.05)] sm:h-12 sm:w-12" />
            <div className="min-w-0 text-center">
              <div className="mx-auto h-4 w-28 animate-pulse rounded-full bg-black/8" />
              <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded-full bg-pine/10" />
            </div>
            <div className="h-11 w-11 sm:h-12 sm:w-12" />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:gap-8 lg:py-8">
        <section className="flex-1 rounded-[30px] border border-black/5 bg-[#fffdfa] p-5 shadow-soft sm:rounded-[32px] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-pine/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pine">
            正在打开示例方案
          </div>

          <div className="mt-5 h-12 w-3/4 animate-pulse rounded-[20px] bg-black/6" />

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
