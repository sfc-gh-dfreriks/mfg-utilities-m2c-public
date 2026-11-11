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

export default function MeterReading() {
  const { apiCompanies, apiCategories, deps, empty } = usePageDeps();
  const { data, loading, error } = useQuery(() => fetchPage('meter-reading', apiCompanies, apiCategories), deps);
  const k = data?.kpis ?? {};
  return (
    <PageState loading={loading} error={error} empty={empty}>
      <div className="space-y-6">

        <SapStrip items={[['EL01', 'create meter read order'], ['EL09', 'mass MRO creation per MRU'], ['EL28', 'enter meter reading results'], ['EL18', 'estimate meter readings']]} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Meter Read Orders" value={formatNumber(k.mros)} icon={FileText} accent="border-sky-300/50 bg-gradient-to-br from-sky-50 to-white" delta={`${formatNumber(k.mrus)} MRUs · ${formatNumber(k.failed)} failed`} deltaType="neutral" />
          <MetricCard title="Read Success" value={pct(k.success)} icon={Gauge} accent="border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white" delta="target ≥ 97% · best-in-class ≥ 99%" deltaType={k.success >= 97 ? 'positive' : 'negative'} />
          <MetricCard title="AMI Share of Reads" value={pct(k.amiShare)} icon={Activity} accent="border-violet-300/50 bg-gradient-to-br from-violet-50 to-white" delta="remote reads, no field visit" deltaType="neutral" />
          <MetricCard title="Estimated Reads" value={pct(k.estimated)} icon={TrendingDown} accent="border-amber-300/50 bg-gradient-to-br from-amber-50 to-white" delta={`${pct(k.winterEstimated)} in winter (Dec-Feb) · avg read delay ${days(k.delay)}`} deltaType="negative" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="MRO Volume by Read Type and Success Rate" className="lg:col-span-2" subtitle="Billing period month; read types AMI, manual, customer self-read, estimated (EL18)">
            <LineChart rows={data?.trend ?? []} height={320} series={[
              { key: 'ami', name: 'AMI', color: COLORS.north, type: 'bar', stack: 'r' }, { key: 'manual', name: 'Manual', color: COLORS.slate, type: 'bar', stack: 'r' },
              { key: 'selfRead', name: 'Customer self-read', color: COLORS.violet, type: 'bar', stack: 'r' }, { key: 'estimated', name: 'Estimated', color: COLORS.south, type: 'bar', stack: 'r' },
              { key: 'success', name: 'Read success %', color: COLORS.good, y: 1 }]} />
          </ChartCard>
          <ChartCard title="Reads by Read Type" subtitle="Volume and success rate">
            <DataTable data={data?.byType ?? []} columns={[{ key: 'name', label: 'Read type', format: titleCase }, { key: 'mros', label: 'MROs', format: formatNumber },
              { key: 'success', label: 'Success', format: pct }, { key: 'delay', label: 'Avg read delay', format: days }]} />
            <p className="mt-4 mb-1 text-xs font-semibold text-gray-500">By read reason</p>
            <DataTable data={data?.byReason ?? []} columns={[{ key: 'name', label: 'Read reason' }, { key: 'mros', label: 'MROs', format: formatNumber }, { key: 'success', label: 'Success', format: pct }]} />
          </ChartCard>
          <ChartCard title="Failed Reads by Reason" subtitle="No access, device failure, AMI communication failure">
            <BarChart rows={data?.failures ?? []} series={[{ key: 'northern', name: 'Northern', color: COLORS.north, stack: 't' }, { key: 'southern', name: 'Southern', color: COLORS.south, stack: 't' }]} height={280} fmt={formatNumber as any} />
          </ChartCard>
          <ChartCard title="Worst Meter Reading Units" subtitle="Lowest read success first">
            <DataTable data={data?.worstMrus ?? []} columns={[{ key: 'mru', label: 'MRU' }, { key: 'territory', label: 'Territory' }, { key: 'mros', label: 'MROs', format: formatNumber },
              { key: 'success', label: 'Success', format: pct }, { key: 'comms', label: 'Comms failures', format: formatNumber }, { key: 'noAccess', label: 'No access', format: formatNumber }, { key: 'device', label: 'Device', format: formatNumber }]} />
          </ChartCard>
          <ChartCard title="Read Delay vs Schedule" subtitle="Avg days from scheduled read date to the read event">
            <LineChart rows={data?.delay ?? []} height={280} fmt={(v) => `${Number(v).toFixed(1)} d`} series={[{ key: 'northern', name: 'Northern', color: COLORS.north }, { key: 'southern', name: 'Southern', color: COLORS.south }]} />
          </ChartCard>
        </div>
        <Lever title="AMI and customer self-read">Every manual or estimated read is a field visit or a later correction. The Southern routes still rely on walk-by reads;
          moving them to AMI (and fixing comms on the worst MRU) lifts read success and removes most estimated reads that later drive outsorting and re-bills.</Lever>
      </div>
    </PageState>
  );
}
