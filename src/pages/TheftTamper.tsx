import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { CurrencyIcon, Gauge, Activity, Building2 } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import ReactECharts from '@/components/Chart';
import Bars from '@/components/Bars';
import PageState from '@/components/PageState';

export default function TheftTamper() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('theft-tamper', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  const kwh = (v: number) => `${formatNumber(v)} kWh`;
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Tamper-Flagged Meters" value={formatNumber(k.devices)} icon={Activity} accent="border-rose-300/50 bg-gradient-to-br from-rose-50 to-red-50"
            delta={`of ${formatNumber(k.amiDevices)} smart meters reporting (${formatPct(100 * (k.devices ?? 0) / (k.amiDevices || 1))})`} deltaType="negative" />
          <MetricCard title="In Southern Territory" value={formatNumber(k.southern)} icon={Building2} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-indigo-50" delta={`of ${formatNumber(k.devices)} flagged meters`} deltaType="neutral" />
          <MetricCard title="Estimated Energy Lost" value={kwh(k.lossKwh)} icon={CurrencyIcon} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-yellow-50"
            delta={`≈ ${formatDollar((k.lossKwh ?? 0) * (k.rateKwh ?? 0))} at the average billed rate`} deltaType="negative" />
          <MetricCard title="Tamper Intervals" value={formatNumber(k.flags)} icon={Gauge} accent="border-cyan-300/50 bg-gradient-to-br from-cyan-50 to-sky-50" delta={`avg ${formatNumber(k.avgDays)} days flagged · ${Number(k.avgVoltage ?? 0).toFixed(1)} V`} deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Tamper Rate by Territory" subtitle="Flagged smart meters / all smart meters reporting, %">
            <Bars rows={data?.rateByTerritory ?? []} label="name" value="pct" color="#ef4444" height={200} format={(v: number) => formatPct(v)} />
          </ChartCard>
          <ChartCard title="Estimated Loss by Region" subtitle="kWh, premise region of the flagged meter">
            <Bars rows={data?.byRegion ?? []} label="name" value="lossKwh" color="#f97316" height={200} format={kwh} />
          </ChartCard>
          <ChartCard title="Flagged Meters" subtitle="Field investigation worklist, largest estimated loss first" className="lg:col-span-2">
            <DataTable data={data?.devices ?? []} columns={[
              { key: 'device', label: 'Meter' }, { key: 'territory', label: 'Territory' }, { key: 'region', label: 'Region' }, { key: 'rate', label: 'Rate' },
              { key: 'firstFlag', label: 'First flag' }, { key: 'lastFlag', label: 'Last flag' }, { key: 'flags', label: 'Flags', format: formatNumber },
              { key: 'voltage', label: 'Avg V', format: (v: any) => (v == null ? '–' : Number(v).toFixed(1)) }, { key: 'lossKwh', label: 'Est. loss', format: kwh },
            ]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
