import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, CreditCard, TrendingDown, Users } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function Collections() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('collections', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Open Receivables" value={formatDollar(k.openAr)} icon={CurrencyIcon} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`of ${formatDollar(k.billed)} posted to FI-CA`} deltaType="neutral" />
          <MetricCard title="Payment Rate" value={formatPct(k.paymentRate)} icon={CreditCard} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta="Share of posted amount cleared" deltaType="neutral" />
          <MetricCard title="Arrears" value={formatDollar(k.arrears)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatDollar(k.arrears90)} over 90 days · ${formatDollar(k.highDunning)} at dunning level 3+`} deltaType="negative" />
          <MetricCard title="Accounts in Arrears" value={formatNumber(k.accountsInArrears)} icon={Users} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`of ${formatNumber(k.accounts)} · avg ${formatNumber(k.avgDaysOverdue)} days overdue`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Posted vs Open by Month" className="lg:col-span-2" subtitle="FI-CA posting month">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } }, { type: 'value', name: 'Paid %', max: 100 }],
              series: [
                { name: 'Posted', type: 'bar', data: trend.map((r: any) => r.billed), itemStyle: { color: '#a5f3fc' } },
                { name: 'Open', type: 'bar', data: trend.map((r: any) => r.openAr), itemStyle: { color: '#f97316' } },
                { name: 'Payment rate %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.paymentRate?.toFixed?.(1)), itemStyle: { color: '#10b981' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Arrears by Aging Bucket" subtitle="Open past-due items, USD">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: (data?.aging ?? []).map((r: any) => r.name) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: (data?.aging ?? []).map((r: any) => r.value), itemStyle: { color: '#ef4444' }, barMaxWidth: 50 }],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Open Items by Dunning Level" subtitle="USD; level 3+ is final notice / disconnection">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: (data?.byDunning ?? []).map((r: any) => r.name) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: (data?.byDunning ?? []).map((r: any) => ({ value: r.value, itemStyle: { color: r.lvl >= 3 ? '#ef4444' : '#29b5e8' } })), barMaxWidth: 50 }],
            }} style={{ height: 260 }} />
          </ChartCard>
          <ChartCard title="Open Receivables by Territory and Division" subtitle="USD" className="lg:col-span-2">
            <Bars rows={data?.byTerritory ?? []} label="name" value="openAr" color="#7c3aed" height={200} leftPad={200} />
          </ChartCard>
          <ChartCard title="Largest Accounts in Arrears" className="lg:col-span-2">
            <DataTable data={data?.top ?? []} columns={[
              { key: 'account', label: 'Contract account' }, { key: 'territory', label: 'Territory' }, { key: 'segment', label: 'Segment' },
              { key: 'dunning', label: 'Dunning', format: formatNumber }, { key: 'daysOverdue', label: 'Max days overdue', format: formatNumber },
              { key: 'items', label: 'Items', format: formatNumber }, { key: 'value', label: 'Past due', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
