import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Gauge, TrendingDown, Activity } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

const gwh = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(2)} GWh`);
const perKwh = (v: any) => (v == null ? '–' : `$${Number(v).toFixed(3)}/kWh`);

export default function RevenueAssurance() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('revenue-assurance', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const trend = data?.trend ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Billed Revenue" value={formatDollar(k.billed)} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-green-50" delta={`${formatNumber(k.bills)} bills · ${perKwh(k.rateKwh)} average`} deltaType="neutral" />
          <MetricCard title="Billed vs Metered" value={gwh(k.billedKwh)} icon={Gauge} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`${gwh(k.meteredKwh)} on meter reads`} deltaType="neutral" />
          <MetricCard title="Outsorted" value={formatPct(k.outsortedPct)} icon={TrendingDown} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatNumber(k.outsorted)} bills · ${formatDollar(k.outsortedAmount)} not invoiced`} deltaType="negative" />
          <MetricCard title="Billed on Estimated Read" value={formatPct(k.estimatedPct)} icon={Activity} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta="Share of bills with an estimated (type 04) read" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Billed vs Metered kWh by Month" className="lg:col-span-2" subtitle="Bill-to month vs read month; metered kWh from canonical meter reads">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, legend: { top: 0 }, grid: { left: 70, right: 60, bottom: 30, top: 40 },
              xAxis: { type: 'category', data: trend.map((r: any) => r.month) },
              yAxis: [{ type: 'value', axisLabel: { formatter: (v: number) => gwh(v) } }, { type: 'value', name: '% of bills' }],
              series: [
                { name: 'Billed kWh', type: 'bar', data: trend.map((r: any) => r.billedKwh), itemStyle: { color: '#29b5e8' } },
                { name: 'Metered kWh', type: 'bar', data: trend.map((r: any) => r.meteredKwh), itemStyle: { color: '#a5f3fc' } },
                { name: 'Outsorted %', type: 'line', yAxisIndex: 1, smooth: true, data: trend.map((r: any) => r.outsortedPct?.toFixed?.(2)), itemStyle: { color: '#ef4444' } },
              ],
            }} style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="Billed Revenue by Rate Category" subtitle="USD">
            <Bars rows={data?.byRate ?? []} label="name" value="billed" color="#10b981" height={240} />
          </ChartCard>
          <ChartCard title="Outsorted Amount by Territory" subtitle="Billed but held from invoicing, USD">
            <Bars rows={data?.byTerritory ?? []} label="name" value="outsortedAmount" color="#ef4444" height={240} />
          </ChartCard>
          <ChartCard title="Rate Category Detail" className="lg:col-span-2">
            <DataTable data={data?.byRate ?? []} columns={[
              { key: 'name', label: 'Rate category' }, { key: 'billed', label: 'Billed', format: formatDollar }, { key: 'kwh', label: 'Billed kWh', format: formatNumber },
              { key: 'rateKwh', label: 'Avg rate', format: perKwh }, { key: 'outsortedPct', label: 'Outsorted', format: formatPct }, { key: 'estimatedPct', label: 'Estimated read', format: formatPct },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
