import { AppShell } from "@/shared/ui/app-shell";

export function BillingPage() {
  return (
    <AppShell
      title="订阅与权益"
      description="这里先放移动端 App 的订阅页骨架，后续再接免费版限制、专业版权益和升级引导。"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-white/80 bg-white/85 p-6">
          <h2 className="font-display text-3xl text-ink">免费版</h2>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted">
            <li>最多 3 个项目</li>
            <li>仅 1 套模板</li>
            <li>PDF 带水印</li>
            <li>不支持 AI 文案辅助</li>
          </ul>
        </section>

        <section className="rounded-[28px] bg-gradient-to-br from-[#17344f] via-[#184d3f] to-[#2c7864] p-6 text-white">
          <h2 className="font-display text-3xl">专业版</h2>
          <strong className="mt-4 block font-display text-5xl">¥39 / 月</strong>
          <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-white/80">
            <li>无限项目</li>
            <li>多模板</li>
            <li>无水印 PDF</li>
            <li>分享链接与 AI 文案辅助</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
