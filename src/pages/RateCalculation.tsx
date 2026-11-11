import { usePageDeps } from '@/hooks/useFilters';
import { useQuery } from '@/hooks/useQuery';
import { fetchPage } from '@/lib/api';
import { formatDollar, formatNumber, formatPct } from '@/lib/utils';
import MetricCard, { Activity, Gauge, Calendar, CreditCard, Receipt, FileText, TrendingDown, Users, CurrencyIcon } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import PageState from '@/components/PageState';
import { SapStrip, Lever, LineChart, BarChart, COLORS, pctFmt, dayFmt, titleCase } from '@/components/M2C';

const days = (v: any) => (v == null ? '–' : `${Number(v).toFixed(1)} d`);
const pct = (v: any) => (v == null ? '–' : formatPct(Number(v)));
const kwh = (v: any) => (v == null ? '–' : `${(Number(v) / 1e6).toFixed(1)} GWh`);

export default function RateCalculation() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('rate-calculation', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['EASIBI', 'individual billing and invoicing'], ['EA19', 'billing simulation'], ['EA38', 'mass billing'], ['ES32', 'review billing documents']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Bills Calculated" value={formatNumber(k.bills)} icon={Receipt} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${formatDollar(k.billed)} · ${kwh(k.kwh)}`} deltaType="neutral" />
          <MetricCard title="Average Rate" value={k.rateKwh == null ? '–' : `$${Number(k.rateKwh).toFixed(3)}/kWh`} icon={CurrencyIcon} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta="net billed / energy kWh" deltaType="neutral" />
          <MetricCard title="TOU Share of Bills" value={pct(k.touShare)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta={`${pct(k.onPeakShare)} of TOU kWh on-peak`} deltaType="neutral" />
          <MetricCard title="Fixed Charge Share" value={pct(k.fixedShare)} icon={Gauge} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta="fixed / (energy + fixed + tax)" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Tariff Mix" subtitle="Flat (C&I small), tiered (residential standard), TOU (residential TOU, C&I large / demand)">
            <DataTable data={data?.byTariff ?? []} columns={[{ key: 'name', label: 'Tariff', format: titleCase }, { key: 'bills', label: 'Bills', format: formatNumber }, { key: 'kwh', label: 'kWh', format: kwh },
              { key: 'billed', label: 'Billed', format: formatDollar }, { key: 'rateKwh', label: '$/kWh', format: (v: any) => (v == null ? '–' : `$${Number(v).toFixed(3)}`) }]} />
          </ChartCard>
          <ChartCard title="Charge Components by Tariff" subtitle="Energy vs fixed vs tax, USD">
            <BarChart rows={(data?.byTariff ?? []).map((r: any) => ({ ...r, name: titleCase(r.name) }))} height={280} fmt={formatDollar as any} series={[
              { key: 'energy', name: 'Energy', color: COLORS.north, stack: 'c' }, { key: 'fixed', name: 'Fixed', color: COLORS.violet, stack: 'c' }, { key: 'tax', name: 'Tax', color: COLORS.slate, stack: 'c' }]} />
          </ChartCard>
          <ChartCard title="TOU Periods: kWh and Charges" subtitle="On-peak / shoulder / off-peak on TOU bills">
            <BarChart rows={(data?.tou ?? []).map((r: any) => ({ ...r, mwh: r.kwh / 1000 }))} height={280} series={[{ key: 'mwh', name: 'MWh', color: COLORS.north }, { key: 'charge', name: 'Charge ($)', color: COLORS.south }]} />
          </ChartCard>
          <ChartCard title="Tier Blocks on Tiered Bills" subtitle="kWh in tier 1 vs tier 2 by territory">
            <BarChart rows={data?.tiers ?? []} height={280} fmt={kwh as any} series={[{ key: 'tier1', name: 'Tier 1', color: COLORS.north, stack: 't' }, { key: 'tier2', name: 'Tier 2', color: COLORS.south, stack: 't' }]} />
          </ChartCard>
          <ChartCard title="Billed Charges by Month" className="lg:col-span-2" subtitle="Energy, fixed and tax, USD">
            <LineChart rows={data?.trend ?? []} height={300} fmt={formatDollar as any} series={[{ key: 'energy', name: 'Energy', color: COLORS.north, type: 'bar', stack: 'c' },
              { key: 'fixed', name: 'Fixed', color: COLORS.violet, type: 'bar', stack: 'c' }, { key: 'tax', name: 'Tax', color: COLORS.slate, type: 'bar', stack: 'c' }]} />
          </ChartCard>
          <ChartCard title="By Rate Category" className="lg:col-span-2">
            <DataTable data={data?.byRate ?? []} columns={[{ key: 'name', label: 'Rate category' }, { key: 'tariff', label: 'Tariff', format: titleCase }, { key: 'bills', label: 'Bills', format: formatNumber },
              { key: 'kwh', label: 'kWh', format: kwh }, { key: 'billed', label: 'Billed', format: formatDollar }, { key: 'rateKwh', label: '$/kWh', format: (v: any) => (v == null ? '–' : `$${Number(v).toFixed(3)}`) }]} />
          </ChartCard>
        </div>
      </div>
    </PageState>
  );
}
