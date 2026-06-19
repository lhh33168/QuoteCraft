export function LoginHero() {
  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%),linear-gradient(135deg,#17344f_0%,#184d3f_48%,#2c7864_100%)] p-6 text-white shadow-soft sm:p-8">
      <div className="absolute right-[-40px] top-[-60px] h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-[-80px] left-[-20px] h-56 w-56 rounded-full bg-[#f7c66a]/20 blur-3xl" />

      <div className="relative">
        <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
          Quick Access
        </div>
        <h1 className="mt-5 max-w-xl font-display text-4xl leading-none sm:text-6xl">
          10 分钟整理需求，快速发出专业报价方案
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base sm:leading-8">
          从客户需求收集、项目结构整理，到 AI 辅助文案、报价明细与分享交付，QuoteCraft
          帮你把方案输出流程收进一套轻量工作台里。
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 01</p>
            <p className="mt-3 text-sm font-semibold">整理客户需求</p>
            <p className="mt-2 text-xs leading-6 text-white/70">统一记录项目背景、报价范围与关键备注。</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 02</p>
            <p className="mt-3 text-sm font-semibold">AI 辅助生成文案</p>
            <p className="mt-2 text-xs leading-6 text-white/70">快速补齐项目简介、服务边界和方案说明。</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Step 03</p>
            <p className="mt-3 text-sm font-semibold">交付与分享客户</p>
            <p className="mt-2 text-xs leading-6 text-white/70">保存草稿、生成明细，并通过链接快速分享。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
