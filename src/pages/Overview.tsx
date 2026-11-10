import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Activity, TrendingDown, Users } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const gwh = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(1)} GWh`);

export default function Overview() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('overview', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  const leak = (data?.leakage ?? []).reduce((s: number, r: any) => s + (r.value ?? 0), 0);
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="What We Billed" value={formatDollar(k.billed)} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50"
            delta={`${formatNumber(k.bills)} bills · ${gwh(k.kwh)} · ${formatNumber(k.contracts)} contracts`} deltaType="neutral" />
          <MetricCard title="Bills Outsorted" value={formatPct(k.outsortedPct)} icon={Activity} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50"
            delta={`${formatDollar(k.outsortedHeld)} held · ${formatPct(k.estimatedPct)} of bills on an estimated read`} deltaType="negative" />
          <MetricCard title="Open Receivables" value={formatDollar(k.openAr)} icon={Users} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50"
            delta={`${formatDollar(k.arrears90)} over 90 days · ${formatNumber(k.highRisk)} high-churn-risk contracts`} deltaType="neutral" />
          <MetricCard title="Revenue at Risk" value={formatDollar(leak)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50"
            delta={`incl. ${formatNumber(k.tamperDevices)} tampered smart meters (${formatNumber(k.tamperLossKwh)} kWh est. loss)`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Billed Revenue, Outsorted and Estimated-Read Rate by Month" className="lg:col-span-2" subtitle="Bill-to month; estimated reads spike in Dec / Jan / Feb">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: '% of bills' }],
              series: [
                { name: 'Billed', type: 'bar', data: trend.map((r: any) => r.billed), itemStyle: { color: '#a5f3fc' } },
                { name: 'Estimated read %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.estimatedPct?.toFixed?.(2)), itemStyle: { color: '#f59e0b' } },
                { name: 'Outsorted %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.outsortedPct?.toFixed?.(2)), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Where Revenue Is at Risk" subtitle="USD, largest first (tamper loss valued at the average billed rate)">
            <Bars rows={data?.leakage ?? []} label="name" value="value" color="#ef4444" height={280} leftPad={230} />
          </ChartCard>
          <ChartCard title="Billed Revenue by Territory" subtitle="Northern = SAP instance A, Southern = SAP instance B">
            <Bars rows={data?.byTerritory ?? []} label="name" value="billed" color="#29b5e8" height={280} />
          </ChartCard>
          <ChartCard title="Billed Revenue by Source System" subtitle="One canonical model across the selected SAP sources" className="lg:col-span-2">
            <Bars rows={data?.bySource ?? []} label="name" value="value" color="#0ea5e9" height={200} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
