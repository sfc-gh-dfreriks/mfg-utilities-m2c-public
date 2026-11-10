import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, FileText, Calendar, TrendingDown } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function BillingExceptions() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('billing-exceptions', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const cal = data?.byCalMonth ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Bills Outsorted" value={formatPct(k.outsortedPct)} icon={FileText} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${formatNumber(k.exceptions)} of ${formatNumber(k.bills)} bills · ${formatNumber(k.contracts)} contracts`} deltaType="neutral" />
          <MetricCard title="Revenue Held" value={formatDollar(k.atRisk)} icon={CurrencyIcon} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`avg ${formatNumber(k.avgDaysOpen)} days since bill-to date`} deltaType="negative" />
          <MetricCard title="Caused by Estimated Reads" value={formatPct(k.estimatedShare)} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50"
            delta={`${formatPct(k.estimatedOutsortRate)} of estimated-read bills outsort vs ${formatPct(k.actualOutsortRate)} on actual reads`} deltaType="negative" />
          <MetricCard title="Winter Estimated Reads" value={formatPct(k.winterEstimatedPct)} icon={Calendar} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`Dec / Jan / Feb · ${formatPct(k.estimatedPct)} across the year`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Estimated Reads and Outsorting by Calendar Month" className="lg:col-span-2" subtitle="% of bills; meter readers miss reads in winter">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 50, right: 20, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: cal.map((r: any) => r.name) }, yAxis: { type: 'value', name: '%' },
              series: [
                { name: 'Estimated read %', type: 'bar', data: cal.map((r: any) => r.estimatedPct?.toFixed?.(2)), itemStyle: { color: '#f59e0b' } },
                { name: 'Outsorted %', type: 'line', smooth: true, data: cal.map((r: any) => r.outsortedPct?.toFixed?.(2)), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 300 }} />
          </ChartCard>
          <ChartCard title="Outsorted Bills by Reason" subtitle="Revenue held, USD">
            <Bars rows={data?.byType ?? []} label="name" value="value" color="#ef4444" height={220} />
          </ChartCard>
          <ChartCard title="Outsorted Bills by Age" subtitle="Days since bill-to date, revenue held">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 70, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: (data?.aging ?? []).map((r: any) => r.name) }, yAxis: { type: 'value', axisLabel: { formatter: (v: number) => formatDollar(v) } },
              series: [{ type: 'bar', data: (data?.aging ?? []).map((r: any) => r.value), itemStyle: { color: '#f97316' }, barMaxWidth: 50 }],
            }} style={{ height: 220 }} />
          </ChartCard>
          <ChartCard title="Largest Outsorted Bills" className="lg:col-span-2">
            <DataTable data={data?.top ?? []} columns={[
              { key: 'billingDoc', label: 'Bill' }, { key: 'contract', label: 'Contract' }, { key: 'territory', label: 'Territory' }, { key: 'rate', label: 'Rate' },
              { key: 'type', label: 'Reason' }, { key: 'billTo', label: 'Bill to' }, { key: 'kwh', label: 'kWh', format: formatNumber },
              { key: 'daysOpen', label: 'Days open', format: formatNumber }, { key: 'value', label: 'Held', format: formatDollar },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
