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

export default function CycleTimes() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('cycle-times', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Read → Bill Created" value={days(k.r2b)} icon={FileText} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`bill → invoice ${days(k.b2i)}`} deltaType="neutral" />
          <MetricCard title="Bill → Delivered" value={days(k.b2d)} icon={Calendar} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta="print / mail vs digital" deltaType="neutral" />
          <MetricCard title="Read → Delivered" value={days(k.r2d)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta={`Northern ${days(k.r2dN)} · Southern ${days(k.r2dS)} (3-7 d best-in-class, 14-21 d legacy)`} deltaType="neutral" />
          <MetricCard title="Invoice → Payment" value={days(k.i2p)} icon={CreditCard} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta="days from invoice to payment received" deltaType="neutral" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Read → Delivered by Month" className="lg:col-span-2" subtitle="Avg days; green band = 3-7 d best-in-class">
            <LineChart rows={data?.trend ?? []} height={300} band={[3, 7, '3-7 d best-in-class']} yMin={0} fmt={dayFmt} series={[
              { key: 'r2dN', name: 'Read → delivered · Northern', color: COLORS.north }, { key: 'r2dS', name: 'Read → delivered · Southern', color: COLORS.south },
              { key: 'r2bN', name: 'Read → bill · Northern', color: '#7dd3fc' }, { key: 'r2bS', name: 'Read → bill · Southern', color: '#fcd34d' }]} />
          </ChartCard>
          <ChartCard title="Cycle Time Components by Territory" subtitle="Avg days">
            <BarChart rows={data?.byTerritory ?? []} height={260} fmt={dayFmt} series={[{ key: 'r2b', name: 'Read → bill', color: COLORS.north }, { key: 'b2d', name: 'Bill → delivered', color: COLORS.violet }, { key: 'r2d', name: 'Read → delivered', color: COLORS.navy }]} />
          </ChartCard>
          <ChartCard title="Cycle Times by Delivery Channel" subtitle="Avg days">
            <DataTable data={data?.byDelivery ?? []} columns={[{ key: 'name', label: 'Channel', format: titleCase }, { key: 'r2b', label: 'Read → bill', format: days }, { key: 'b2i', label: 'Bill → invoice', format: days },
              { key: 'i2d', label: 'Invoice → delivered', format: days }, { key: 'r2d', label: 'Read → delivered', format: days }]} />
          </ChartCard>
          <ChartCard title="Invoice → Payment by Month" subtitle="Avg days by territory">
            <LineChart rows={data?.i2pTrend ?? []} height={280} fmt={dayFmt} series={[{ key: 'northern', name: 'Northern', color: COLORS.north }, { key: 'southern', name: 'Southern', color: COLORS.south }]} />
          </ChartCard>
          <ChartCard title="Invoice → Payment by Payment Channel" subtitle="Fastest first">
            <BarChart rows={data?.byPayment ?? []} horizontal leftPad={120} height={280} fmt={(v) => `${Number(v).toFixed(1)} d`} series={[{ key: 'i2p', name: 'Avg days', color: COLORS.navy }, { key: 'p50', name: 'Median days', color: COLORS.slate }]} />
          </ChartCard>
        </div>
        <Lever title="integrated platform vs fragmented handoffs">Each handoff (read upload, VEE queue, billing batch, print vendor, lockbox file) adds days.
          The Northern territory runs these on one integrated digital chain; the Southern legacy chain waits at every step.</Lever>
      </div>
    </PageState>
  );
}
