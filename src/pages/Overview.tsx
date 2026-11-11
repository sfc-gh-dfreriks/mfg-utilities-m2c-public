import { ArrowRight, ChevronRight } from 'lucide-react';
import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { cn, formatDollar, formatNumber } from '@/lib/utils';
import type { PageId } from '@/components/Sidebar';
import ChartCard from '@/components/ChartCard';
import PageState from '@/components/PageState';
import { KPI_DEFS, KpiTile, RAG_STYLE, rag, fmtKpi, BarChart, COLORS, type KpiDef } from '@/components/M2C';

const def = (k: string) => KPI_DEFS.find((d) => d.key === k)!;
// Stage KPI on each stage card, and the best-in-class target used to rank friction (relative gap).
const STAGE_KPI: Record<number, { label: string; get: (k: any) => any; def: KpiDef; target: number }> = {
  1: { label: 'Read success', get: (k) => k.readSuccess, def: def('readSuccess'), target: 99 },
  2: { label: 'VEE first pass', get: (k) => k.veeFirstPass, def: def('veeFirstPass'), target: 94 },
  3: { label: 'Clean (not outsorted)', get: (k) => (k.outsorted == null ? null : 100 - k.outsorted), def: { key: 'clean', label: 'Clean', unit: '%', dir: 'up', green: 97, amber: 95, band: 'target ≥ 97%' }, target: 98 },
  4: { label: 'Billing accuracy', get: (k) => k.billingAccuracy, def: def('billingAccuracy'), target: 98 },
  5: { label: 'Read → delivered', get: (k) => k.readToDelivery, def: def('readToDelivery'), target: 7 },
  6: { label: 'Auto cash application', get: (k) => k.autoCash, def: def('autoCash'), target: 95 },
  7: { label: 'Arrangement breakage', get: (k) => k.breakage, def: def('breakage'), target: 20 },
};
const gap = (no: number, k: any) => {
  const s = STAGE_KPI[no]; const v = s.get(k);
  if (v == null) return null;
  return 100 * (s.def.dir === 'up' ? (s.target - v) / s.target : (v - s.target) / s.target);
};

export default function Overview({ onNavigate }: { onNavigate?: (p: PageId) => void }) {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const stages: any[] = data?.stages ?? [];
  const terr: any[] = data?.byTerritory ?? [];
  const trend: any[] = data?.trend ?? [];
  const friction = stages.map((s) => ({ ...s, gap: gap(s.no, k), kpi: STAGE_KPI[s.no] }))
    .filter((s) => s.gap != null).sort((a, b) => b.gap - a.gap);
  const maxGap = Math.max(1, ...friction.map((f) => Math.max(0, f.gap)));
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <ChartCard title="The Meter-to-Cash Cycle" subtitle={`7 stages · ${formatNumber(k.mros)} meter read orders → ${formatNumber(k.bills)} bills (${formatDollar(k.billed)}) → ${formatNumber(k.payments)} payments · click a stage to drill in`}>
          <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
            {stages.map((s, i) => {
              const sk = STAGE_KPI[s.no]; const v = sk.get(k); const r = rag(sk.def, v);
              return (
                <div key={s.no} className="flex items-center">
                  <button onClick={() => onNavigate?.(s.page as PageId)}
                    className={cn('flex w-[150px] flex-col rounded-xl border-2 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md', RAG_STYLE[r].border)}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stage {s.no}</span>
                    <span className="text-sm font-bold leading-tight text-sf-deeper">{s.name}</span>
                    <span className="mt-2 text-lg font-extrabold text-gray-900">{formatNumber(s.entered)}</span>
                    <span className="text-[10px] text-gray-500">{s.unit}</span>
                    <div className="mt-2 h-1.5 w-full rounded bg-gray-200"><div className="h-1.5 rounded bg-sf-primary" style={{ width: `${Math.min(100, s.completion)}%` }} /></div>
                    <span className="mt-0.5 text-[10px] text-gray-500">{s.completion.toFixed(1)}% completed cleanly</span>
                    <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-gray-700">
                      <span className={cn('h-2 w-2 rounded-full', RAG_STYLE[r].dot)} />{sk.label}: {fmtKpi(sk.def, v)}
                    </span>
                    <span className="text-[10px] text-gray-400">{sk.def.band}</span>
                  </button>
                  {i < stages.length - 1 && <ChevronRight className="mx-0.5 h-5 w-5 shrink-0 text-gray-300" />}
                </div>
              );
            })}
          </div>
        </ChartCard>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {KPI_DEFS.map((d) => <KpiTile key={d.key} def={d} value={k[d.key]} trend={trend.map((t) => t[d.key])} />)}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <ChartCard title="Northern vs Southern: modern digital vs legacy" className="xl:col-span-3"
            subtitle="Northern (SAP A): AMI, e-bill, AutoPay and wallets · Southern (SAP B): manual reads, paper bills, lockbox">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead><tr className="bg-sf-dark text-white"><th className="px-3 py-2 text-left font-medium">KPI</th>
                  {terr.map((t) => <th key={t.name} className="px-3 py-2 text-right font-medium">{t.name}</th>)}<th className="px-3 py-2 text-left font-medium">Benchmark</th></tr></thead>
                <tbody>
                  {KPI_DEFS.map((d, i) => (
                    <tr key={d.key} className={i % 2 ? 'bg-sky-50/50' : 'bg-white'}>
                      <td className="px-3 py-1.5 font-medium text-gray-700">{d.label}</td>
                      {terr.map((t) => { const r = rag(d, t[d.key]); return (
                        <td key={t.name} className="px-3 py-1.5 text-right"><span className={cn('inline-flex items-center gap-1.5 font-semibold', RAG_STYLE[r].text)}>
                          <span className={cn('h-2 w-2 rounded-full', RAG_STYLE[r].dot)} />{fmtKpi(d, t[d.key])}</span></td>); })}
                      <td className="px-3 py-1.5 text-xs text-gray-500">{d.band}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
          <ChartCard title="Where is the friction?" className="xl:col-span-2" subtitle="Stages ranked by gap to the best-in-class target (relative %)">
            <div className="space-y-2">
              {friction.map((f) => (
                <button key={f.no} onClick={() => onNavigate?.(f.page as PageId)} className="group block w-full text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{f.no}. {f.name}</span>
                    <span className="flex items-center gap-1 text-gray-500">{f.kpi.label} {fmtKpi(f.kpi.def, f.kpi.get(k))} vs {fmtKpi(f.kpi.def, f.kpi.target)}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" /></span>
                  </div>
                  <div className="mt-1 h-3 w-full rounded bg-gray-100">
                    <div className={cn('h-3 rounded', f.gap > 15 ? 'bg-red-400' : f.gap > 3 ? 'bg-amber-400' : 'bg-emerald-400')} style={{ width: `${Math.max(2, (100 * Math.max(0, f.gap)) / maxGap)}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{f.gap <= 0 ? 'at or better than target' : `${f.gap.toFixed(1)}% off target`}</span>
                </button>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Read-to-Bill Window by Territory" subtitle="Average days from actual read to bill delivered (best-in-class 3-7 d, legacy 14-21 d)">
            <BarChart rows={terr} series={[{ key: 'readToDelivery', name: 'Read → delivered (days)', color: COLORS.north }]} height={240} fmt={(v) => `${Number(v).toFixed(1)} d`} />
          </ChartCard>
          <ChartCard title="DSO and Invoice-to-Payment by Territory" subtitle="DSO = avg daily open AR / avg daily billing of the trailing 91 days">
            <BarChart rows={terr} series={[{ key: 'dso', name: 'DSO', color: COLORS.navy }, { key: 'invoiceToPayment', name: 'Invoice → payment', color: COLORS.south }]} height={240} fmt={(v) => `${Number(v).toFixed(1)} d`} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
