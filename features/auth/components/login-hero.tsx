export function LoginHero() {
  return (
    <section className="rounded-[30px] border border-white/70 bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-8 text-white shadow-soft">
      <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
        Quick Access
      </div>
      <h1 className="mt-5 max-w-xl font-display text-5xl leading-none sm:text-6xl">
        10 分钟发出一份像样的报价方案
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-8 text-white/80 sm:text-base">
        聚焦登录、项目整理、报价组合、AI 文案辅助和客户分享闭环，让业务端在移动场景里也能高效输出专业方案。
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/85">
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">自动保存草稿</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">AI 辅助文案</span>
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">分享给客户</span>
      </div>
    </section>
  );
}
