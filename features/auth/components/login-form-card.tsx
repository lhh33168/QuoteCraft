import Link from "next/link";

export function LoginFormCard() {
  return (
    <section className="rounded-[30px] border border-white/80 bg-white/85 p-8 shadow-soft backdrop-blur">
      <h2 className="font-display text-3xl text-ink">邮箱登录</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        首版使用 Magic Link / OTP 登录。这里先保留前端壳子，后续接入 Supabase Auth。
      </p>
      <form className="mt-8 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            工作邮箱
          </label>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 outline-none"
            defaultValue="hello@quotecraft.cn"
            placeholder="name@company.com"
            type="email"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-pine px-5 text-sm font-semibold text-white"
            type="button"
          >
            发送登录链接
          </button>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-ink"
            href="/workspace"
          >
            体验示例项目
          </Link>
        </div>
      </form>
    </section>
  );
}
