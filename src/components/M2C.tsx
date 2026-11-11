// Shared Meter-to-Cash building blocks: KPI definitions with benchmark bands and RAG, the "In SAP IS-U" strip,
// optimization lever notes and small ECharts helpers.
import type { ReactNode } from 'react';
import { Lightbulb, Monitor } from 'lucide-react';
import ReactECharts from '@/components/Chart';
import { cn } from '@/lib/utils';

export type Rag = 'green' | 'amber' | 'red' | 'none';
export interface KpiDef {
  key: string; label: string; unit: '%' | 'd'; dir: 'up' | 'down'; green: number; amber: number; band: string; digits?: number;
}
// Thresholds: up = higher is better (value >= green is green, >= amber is amber); down = lower is better.
export const KPI_DEFS: KpiDef[] = [
  { key: 'readSuccess', label: 'Meter read success', unit: '%', dir: 'up', green: 97, amber: 95, band: 'target ≥ 97% · best-in-class ≥ 99%' },
  { key: 'veeFirstPass', label: 'VEE first pass', unit: '%', dir: 'up', green: 90, amber: 88, band: 'benchmark 90-94%' },
  { key: 'readToDelivery', label: 'Read-to-bill (read → delivered)', unit: 'd', dir: 'down', green: 7, amber: 14, band: 'best-in-class 3-7 d · legacy 14-21 d' },
  { key: 'billingAccuracy', label: 'Billing accuracy', unit: '%', dir: 'up', green: 95, amber: 93, band: 'benchmark > 95%' },
  { key: 'exceptionRate', label: 'Exception rate', unit: '%', dir: 'down', green: 10, amber: 15, band: 'benchmark < 10% of bills' },
  { key: 'invoiceToPayment', label: 'Invoice-to-payment', unit: 'd', dir: 'down', green: 25, amber: 30, band: 'good ≤ 25 d (bills due ~21 d)' },
  { key: 'dso', label: 'DSO', unit: 'd', dir: 'down', green: 30, amber: 35, band: 'utility norm 30-35 d · leading < 30 d' },
  { key: 'autoCash', label: 'Auto cash application', unit: '%', dir: 'up', green: 90, amber: 85, band: 'leading ≥ 90%' },
  { key: 'writeOff', label: 'Write-off rate', unit: '%', dir: 'down', green: 1, amber: 1.5, band: 'benchmark < 1% of billed', digits: 2 },
  { key: 'breakage', label: 'Arrangement breakage', unit: '%', dir: 'down', green: 20, amber: 30, band: 'typical 20-30% · leading < 20%' },
];

export function rag(def: KpiDef, v: any): Rag {
  if (v == null || Number.isNaN(Number(v))) return 'none';
  const n = Number(v);
  if (def.dir === 'up') return n >= def.green ? 'green' : n >= def.amber ? 'amber' : 'red';
  return n <= def.green ? 'green' : n <= def.amber ? 'amber' : 'red';
}
export function fmtKpi(def: Pick<KpiDef, 'unit' | 'digits'>, v: any): string {
  if (v == null || Number.isNaN(Number(v))) return '–';
  return def.unit === '%' ? `${Number(v).toFixed(def.digits ?? 1)}%` : `${Number(v).toFixed(1)} d`;
}
export const RAG_STYLE: Record<Rag, { dot: string; border: string; text: string; label: string }> = {
  green: { dot: 'bg-emerald-500', border: 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white', text: 'text-emerald-700', label: 'On benchmark' },
  amber: { dot: 'bg-amber-400', border: 'border-amber-300 bg-gradient-to-br from-amber-50 to-white', text: 'text-amber-700', label: 'Near benchmark' },
  red: { dot: 'bg-red-500', border: 'border-red-300 bg-gradient-to-br from-red-50 to-white', text: 'text-red-700', label: 'Off benchmark' },
  none: { dot: 'bg-gray-300', border: 'border-gray-200 bg-white', text: 'text-gray-500', label: 'No data' },
};

export function KpiTile({ def, value, sub, trend }: { def: KpiDef; value: any; sub?: string; trend?: number[] }) {
  const r = rag(def, value);
  const st = RAG_STYLE[r];
  const pts = (trend ?? []).filter((x) => x != null && !Number.isNaN(x));
  let spark: ReactNode = null;
  if (pts.length > 1) {
    const max = Math.max(...pts), min = Math.min(...pts), range = max - min || 1;
    const p = pts.map((v, i) => `${(i / (pts.length - 1)) * 80},${22 - ((v - min) / range) * 20}`).join(' ');
    spark = <svg width={80} height={24} className="mt-1"><polyline points={p} fill="none" stroke="#64748b" strokeWidth="1.5" /></svg>;
  }
  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', st.border)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{def.label}</p>
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', st.dot)} title={st.label} />
      </div>
      <p className="mt-1 text-2xl font-extrabold text-gray-900">{fmtKpi(def, value)}</p>
      <p className={cn('text-[11px] font-medium', st.text)}>{st.label} · {def.band}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>}
      {spark}
    </div>
  );
}

export function SapStrip({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/70 px-4 py-2 text-xs text-sky-900">
      <span className="flex items-center gap-1 font-bold"><Monitor className="h-3.5 w-3.5" /> In SAP IS-U</span>
      {items.map(([code, text]) => (
        <span key={code} className="rounded border border-sky-200 bg-white px-2 py-0.5"><b className="font-mono">{code}</b> {text}</span>
      ))}
    </div>
  );
}

export function Lever({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-950">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
      <div><b>Optimization lever: {title}.</b> {children}</div>
    </div>
  );
}

export const COLORS = { north: '#29b5e8', south: '#f59e0b', good: '#10b981', bad: '#ef4444', violet: '#8b5cf6', slate: '#94a3b8', navy: '#11567f' };
const n = (v: any, d = 2) => (v == null || Number.isNaN(Number(v)) ? null : Number(Number(v).toFixed(d)));

/** Monthly line chart (optionally with a shaded benchmark band). */
export function LineChart({ rows, x = 'month', series, height = 300, yName, band, yMin, yMax, fmt }: {
  rows: any[]; x?: string; series: { key: string; name: string; color: string; type?: 'line' | 'bar'; stack?: string; y?: number }[];
  height?: number; yName?: string; band?: [number, number, string]; yMin?: number; yMax?: number; fmt?: (v: number) => string;
}) {
  const s = series.map((sr, i) => ({
    name: sr.name, type: sr.type ?? 'line', smooth: true, stack: sr.stack, yAxisIndex: sr.y ?? 0, showSymbol: false,
    data: rows.map((r) => n(r[sr.key])), itemStyle: { color: sr.color }, barMaxWidth: 28,
    ...(i === 0 && band ? { markArea: { silent: true, itemStyle: { color: 'rgba(16,185,129,0.10)' }, label: { show: true, position: 'insideTopLeft', fontSize: 10, color: '#047857' },
      data: [[{ yAxis: band[0], name: band[2] }, { yAxis: band[1] }]] } } : {}),
  }));
  const hasY2 = series.some((x) => x.y === 1);
  return (
    <ReactECharts keepOrder option={{
      tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 60, right: hasY2 ? 60 : 20, bottom: 30, top: 40 },
      xAxis: { type: 'category', data: rows.map((r) => r[x]) },
      yAxis: [{ type: 'value', name: yName, min: yMin, max: yMax, scale: yMin == null, axisLabel: fmt ? { formatter: fmt } : undefined }, ...(hasY2 ? [{ type: 'value' }] : [])],
      series: s,
    }} style={{ height }} />
  );
}

/** Category bar chart (vertical), several series side by side or stacked. keepOrder keeps the given order. */
export function BarChart({ rows, x = 'name', series, height = 280, horizontal, fmt, keepOrder = true, leftPad }: {
  rows: any[]; x?: string; series: { key: string; name: string; color: string; stack?: string }[]; height?: number; horizontal?: boolean;
  fmt?: (v: number) => string; keepOrder?: boolean; leftPad?: number;
}) {
  const cat = { type: 'category', data: rows.map((r) => r[x]), axisLabel: { fontSize: 10, interval: 0, width: (leftPad ?? 120) - 10, overflow: 'truncate' }, inverse: horizontal };
  const val = { type: 'value', axisLabel: fmt ? { formatter: fmt } : undefined };
  return (
    <ReactECharts keepOrder={keepOrder} option={{
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: fmt },
      legend: series.length > 1 ? { top: 0 } : undefined,
      grid: { left: horizontal ? (leftPad ?? 120) : 60, right: 20, bottom: 30, top: series.length > 1 ? 36 : 12 },
      xAxis: horizontal ? val : cat, yAxis: horizontal ? cat : val,
      series: series.map((sr) => ({ name: sr.name, type: 'bar', stack: sr.stack, data: rows.map((r) => n(r[sr.key])), itemStyle: { color: sr.color }, barMaxWidth: 30 })),
    }} style={{ height }} />
  );
}

export const pctFmt = (v: number) => `${Number(v).toFixed(0)}%`;
export const dayFmt = (v: number) => `${Number(v).toFixed(0)} d`;
export const titleCase = (s: any) => String(s ?? '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
