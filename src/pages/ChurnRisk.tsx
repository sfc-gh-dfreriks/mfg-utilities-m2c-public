import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Users, TrendingDown, Calendar } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function ChurnRisk() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('churn-risk', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const bands = data?.scoreBands ?? [];
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="High Churn Risk" value={formatNumber(k.highRisk)} icon={Users} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50" delta={`${formatPct(k.highRiskPct)} of ${formatNumber(k.contracts)} contracts · dunning level 3+`} deltaType="negative" />
          <MetricCard title="Arrears at Risk" value={formatDollar(k.highRiskArrears)} icon={CurrencyIcon} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50" delta={`avg ${Number(k.highRiskMissed ?? 0).toFixed(1)} missed payments per high-risk contract`} deltaType="negative" />
          <MetricCard title="Average Risk Score" value={Number(k.avgScore ?? 0).toFixed(1)} icon={TrendingDown} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta="0-100: missed payments, dunning, consumption trend, move-out" deltaType="neutral" />
          <MetricCard title="Upcoming Move-Outs" value={formatNumber(k.moveOuts)} icon={Calendar} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta="Move-out recorded within 3 months" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="High-Risk Share by Territory" subtitle="% of contracts at dunning level 3+">
            <Bars rows={data?.byTerritory ?? []} label="name" value="pct" color="#ef4444" height={200} format={(v: number) => formatPct(v)} />
          </ChartCard>
          <ChartCard title="Contracts by Risk Score" subtitle="Churn risk score band">
            <ReactECharts keepOrder option={{
              tooltip: { trigger: 'axis' }, grid: { left: 60, right: 20, bottom: 30, top: 20 },
              xAxis: { type: 'category', data: bands.map((r: any) => r.name) }, yAxis: { type: 'value' },
              series: [{ type: 'bar', data: bands.map((r: any) => r.contracts), itemStyle: { color: '#7c3aed' }, barMaxWidth: 50 }],
            }} style={{ height: 200 }} />
          </ChartCard>
          <ChartCard title="High-Risk Arrears by Region" subtitle="USD past due on high-risk contracts" className="lg:col-span-2">
            <Bars rows={data?.byRegion ?? []} label="name" value="arrears" color="#f97316" height={240} />
          </ChartCard>
          <ChartCard title="Highest-Risk Contracts" subtitle="Retention and collections worklist" className="lg:col-span-2">
            <DataTable data={data?.top ?? []} columns={[
              { key: 'contract', label: 'Contract' }, { key: 'territory', label: 'Territory' }, { key: 'region', label: 'Region' }, { key: 'rate', label: 'Rate' },
              { key: 'missed', label: 'Missed', format: formatNumber }, { key: 'dunning', label: 'Dunning', format: formatNumber },
              { key: 'arrears', label: 'Arrears', format: formatDollar }, { key: 'moveOut', label: 'Move-out', format: (v: any) => (v ? 'Yes' : '') },
              { key: 'score', label: 'Score', format: (v: any) => Number(v ?? 0).toFixed(0) },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
