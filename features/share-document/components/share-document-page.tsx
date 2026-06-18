import { formatMoney } from "@/shared/lib/format-money";
import type { ProjectDetail } from "@/shared/types/project";

type ShareDocumentPageProps = {
  document: ProjectDetail & {
    token: string;
  };
};

export function ShareDocumentPage({ document }: ShareDocumentPageProps) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6">
      <section className="rounded-[32px] border border-black/5 bg-[#fffdfa] p-6 shadow-soft sm:p-8">
        <div className="inline-flex rounded-full bg-pine/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-pine">
          公开只读方案
        </div>
        <h1 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
          {document.project.title}
        </h1>
        <p className="mt-4 text-sm leading-8 text-muted sm:text-base">{document.project.summary}</p>

        <section className="mt-8 border-t border-black/8 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">服务范围</h2>
          <p className="mt-3 text-sm leading-8 text-ink sm:text-base">{document.project.scope}</p>
        </section>

        <section className="mt-8 border-t border-black/8 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">报价明细</h2>
          <div className="mt-4 space-y-4">
            {document.quoteItems.map((item) => (
              <article className="rounded-[22px] border border-black/6 bg-[#fcfaf5] p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{item.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                  </div>
                  <strong className="font-display text-2xl text-pine">{formatMoney(item.subtotal)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[24px] bg-gradient-to-r from-pineSoft to-[#f6efe3] p-5">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">项目总金额</span>
          <strong className="mt-2 block font-display text-4xl text-pine">{formatMoney(document.project.totalPrice)}</strong>
        </section>

        <section className="mt-8 grid gap-5 border-t border-black/8 pt-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">工期说明</h2>
            <p className="mt-3 text-sm leading-8 text-ink">{document.project.duration}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">交付说明</h2>
            <p className="mt-3 text-sm leading-8 text-ink">{document.project.deliveryNote}</p>
          </div>
        </section>
      </section>
    </main>
  );
}
